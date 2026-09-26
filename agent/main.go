package main

import (
	"flag"
	"log"

	"tartarus-agent/config"
)

func main() {
	agentID := flag.String("agent-id", "", "Agent UUID from backend registration")
	c2URL := flag.String("c2", "http://localhost:8000", "C2 endpoint URL")
	privKey := flag.String("privkey", "agent_private.pem", "Path to RSA private key PEM")
	flag.Parse()

	if *agentID == "" {
		log.Fatal("--agent-id required")
	}

	_ = config.AgentConfig{
		AgentID:     *agentID,
		C2BaseURL:   *c2URL,
		PrivKeyPath: *privKey,
		PollMin:     30,
		PollMax:     120,
	}

	log.Printf("[TARTARUS-AGENT] Initialized for AgentID=%s", *agentID)
	// Transport poll loop will be started here when implemented
}

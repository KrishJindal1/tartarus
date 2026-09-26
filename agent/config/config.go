package config

// AgentConfig holds runtime configuration for the endpoint agent.
type AgentConfig struct {
	AgentID     string
	C2BaseURL   string
	PrivKeyPath string
	PollMin     int
	PollMax     int
}

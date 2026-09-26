package executor

import (
	"tartarus-agent/forensics"
)

// Opcode constants
const (
	OpNOP     = 0x00
	OpCollect = 0x02
	OpDump    = 0x03
	OpAnalyze = 0x04
	OpExec    = 0x05
)

// ForensicResult aggregates findings collected during execution.
type ForensicResult struct {
	Processes   []forensics.ProcessInfo  `json:"processes,omitempty"`
	Network     []forensics.NetConn      `json:"network,omitempty"`
	Memory      []forensics.MemRegion    `json:"memory,omitempty"`
	Persistence []forensics.PersistEntry `json:"persistence,omitempty"`
	RiskScore   float64                  `json:"risk_score"`
	Findings    []string                 `json:"findings"`
}

// ExecuteIR executes the decoded bytecode instructions and gathers forensic artifacts.
func ExecuteIR(ir []byte, execMode string) ([]byte, error) {
	// Implementation placeholder
	return nil, nil
}

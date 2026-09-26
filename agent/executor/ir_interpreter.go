package executor

import (
	"encoding/json"
	"fmt"

	"tartarus-agent/forensics"
)

// Opcode constants.
const (
	OpNOP   = 0x00
	OpCALL  = 0x01
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

// ExecuteIR executes the supported IR instructions.
//
// At this stage, only the controlled CALL instruction is supported.
// Unsupported opcodes are rejected rather than executed.
func ExecuteIR(ir []byte, execMode string) ([]byte, error) {
	if len(ir) == 0 {
		return nil, fmt.Errorf("empty IR")
	}

	if execMode == "" {
		execMode = "user_mode"
	}

	offset := 0

	opcode := ir[offset]
	offset++

	switch opcode {
	case OpNOP:
		return []byte{}, nil

	case OpCALL:
		namespace, function, nextOffset, err := decodeCall(ir, offset)
		if err != nil {
			return nil, err
		}

		if nextOffset != len(ir) {
			return nil, fmt.Errorf(
				"unexpected trailing bytes after CALL instruction",
			)
		}

		result, err := dispatchCall(namespace, function, execMode)
		if err != nil {
			return nil, err
		}

		return json.Marshal(result)

	default:
		return nil, fmt.Errorf(
			"unsupported IR opcode: 0x%02x",
			opcode,
		)
	}
}

func decodeCall(
	ir []byte,
	offset int,
) (string, string, int, error) {

	if offset >= len(ir) {
		return "", "", offset, fmt.Errorf(
			"missing namespace length",
		)
	}

	namespaceLength := int(ir[offset])
	offset++

	if offset+namespaceLength > len(ir) {
		return "", "", offset, fmt.Errorf(
			"invalid namespace length",
		)
	}

	namespace := string(
		ir[offset : offset+namespaceLength],
	)

	offset += namespaceLength

	if offset >= len(ir) {
		return "", "", offset, fmt.Errorf(
			"missing function length",
		)
	}

	functionLength := int(ir[offset])
	offset++

	if offset+functionLength > len(ir) {
		return "", "", offset, fmt.Errorf(
			"invalid function length",
		)
	}

	function := string(
		ir[offset : offset+functionLength],
	)

	offset += functionLength

	return namespace, function, offset, nil
}

func dispatchCall(
	namespace string,
	function string,
	execMode string,
) (any, error) {

	if execMode != "user_mode" {
		return nil, fmt.Errorf(
			"unsupported execution mode: %s",
			execMode,
		)
	}

	switch namespace {
	case "system":
		switch function {
		case "info":
			return forensics.CollectSystem(), nil

		default:
			return nil, fmt.Errorf(
				"unknown system function: %s.%s",
				namespace,
				function,
			)
		}

	default:
		return nil, fmt.Errorf(
			"unknown JOCKY namespace: %s",
			namespace,
		)
	}
}
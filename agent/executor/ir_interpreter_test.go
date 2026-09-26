package executor

import (
	"testing"
)

func TestExecuteSystemInfo(t *testing.T) {
	ir := []byte{
		0x01, // CALL
		0x06, // "system" length
		's', 'y', 's', 't', 'e', 'm',
		0x04, // "info" length
		'i', 'n', 'f', 'o',
	}

	result, err := ExecuteIR(ir, "user_mode")

	if err != nil {
		t.Fatalf("ExecuteIR failed: %v", err)
	}

	t.Logf("Result: %s", result)
}

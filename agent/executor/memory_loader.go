package executor

// heldTasks keeps the most recent task bytes resident in process memory only.
// The payload is never written to disk (fileless execution requirement).
var heldTasks [][]byte

// LoadTaskInMemory pins a task payload in RAM for execution.
func LoadTaskInMemory(taskBytes []byte) error {
	if len(taskBytes) == 0 {
		return nil
	}
	// copy so caller buffers can be released
	cp := make([]byte, len(taskBytes))
	copy(cp, taskBytes)
	heldTasks = append(heldTasks, cp)
	// keep at most 8 tasks resident
	if len(heldTasks) > 8 {
		heldTasks = heldTasks[len(heldTasks)-8:]
	}
	return nil
}

// ClearTasks drops pinned task payloads from memory.
func ClearTasks() {
	heldTasks = nil
}

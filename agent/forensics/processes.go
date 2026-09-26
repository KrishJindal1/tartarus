package forensics

// ProcessInfo represents metadata of an inspected endpoint process.
type ProcessInfo struct {
	PID          int      `json:"pid"`
	PPID         int      `json:"ppid"`
	Name         string   `json:"name"`
	ExePath      string   `json:"exe_path"`
	IsSuspicious bool     `json:"is_suspicious"`
	LoadedDLLs   []string `json:"loaded_dlls,omitempty"`
	MemoryMB     float64  `json:"memory_mb"`
}

// CollectProcesses enumerates running processes and analyzes them for anomalies.
func CollectProcesses() []ProcessInfo {
	// Implementation placeholder
	return nil
}

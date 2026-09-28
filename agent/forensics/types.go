package forensics

import "time"

// Shared forensic data types returned by the JOCKY collectors.

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

// NetConn represents an active network connection or listening socket.
type NetConn struct {
	Protocol   string `json:"protocol"`
	LocalAddr  string `json:"local_addr"`
	LocalPort  int    `json:"local_port"`
	RemoteAddr string `json:"remote_addr"`
	RemotePort int    `json:"remote_port"`
	State      string `json:"state"`
	PID        int    `json:"pid"`
}

// MemRegion represents a process virtual memory region.
type MemRegion struct {
	PID         int    `json:"pid"`
	BaseAddress string `json:"base_address"`
	RegionSize  int64  `json:"region_size"`
	Permissions string `json:"permissions"`
	Mapping     string `json:"mapping,omitempty"`
}

// PersistEntry represents a detected persistence mechanism (cron, systemd, run key, service).
type PersistEntry struct {
	Type        string `json:"type"`
	Name        string `json:"name"`
	Path        string `json:"path"`
	Command     string `json:"command"`
	IsEnabled   bool   `json:"is_enabled"`
	RiskFinding string `json:"risk_finding,omitempty"`
}

// FileArtifact represents metadata and integrity hashes for analyzed endpoint files.
type FileArtifact struct {
	Path         string    `json:"path"`
	SizeBytes    int64     `json:"size_bytes"`
	SHA256       string    `json:"sha256"`
	ModifiedTime time.Time `json:"modified_time"`
	Permissions  string    `json:"permissions"`
	IsSuspicious bool      `json:"is_suspicious"`
}

// LogonSession represents an active user session or authentication audit log event.
type LogonSession struct {
	SessionID   string    `json:"session_id"`
	Username    string    `json:"username"`
	Domain      string    `json:"domain"`
	LogonType   string    `json:"logon_type"`
	LogonTime   time.Time `json:"logon_time"`
	SourceIP    string    `json:"source_ip,omitempty"`
	IsPrivilege bool      `json:"is_privilege"`
}

// RegistryFinding represents a forensic key or value extracted from registry hives.
type RegistryFinding struct {
	Hive      string `json:"hive"`
	KeyPath   string `json:"key_path"`
	ValueName string `json:"value_name"`
	ValueType string `json:"value_type"`
	Data      string `json:"data"`
}

// SystemInfo aggregates endpoint hardware, OS distribution, kernel, and patch level data.
type SystemInfo struct {
	Hostname     string   `json:"hostname"`
	OSType       string   `json:"os_type"`
	OSVersion    string   `json:"os_version"`
	Kernel       string   `json:"kernel"`
	Architecture string   `json:"architecture"`
	UptimeSec    int64    `json:"uptime_sec"`
	InstalledAV  []string `json:"installed_av,omitempty"`
}

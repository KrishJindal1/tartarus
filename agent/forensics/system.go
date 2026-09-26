package forensics

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

// CollectSystem gathers host system metadata and security baseline information.
func CollectSystem() SystemInfo {
	// Implementation placeholder
	return SystemInfo{}
}

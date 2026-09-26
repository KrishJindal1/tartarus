package forensics

import (
	"os"
	"runtime"
	

	"golang.org/x/sys/unix"
)

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
	hostname, err := os.Hostname()
	if err != nil {
		hostname = "unknown"
	}

	var uts unix.Utsname

	kernel := "unknown"

	if err := unix.Uname(&uts); err == nil {
		kernel = unix.ByteSliceToString(uts.Release[:])
	}

	uptime := int64(0)

	var sysinfo unix.Sysinfo_t

	if err := unix.Sysinfo(&sysinfo); err == nil {
		uptime = int64(sysinfo.Uptime)
	}

	return SystemInfo{
		Hostname:     hostname,
		OSType:       runtime.GOOS,
		OSVersion:    "unknown",
		Kernel:       kernel,
		Architecture: runtime.GOARCH,
		UptimeSec:    uptime,
	}
}
//go:build linux

package forensics

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"golang.org/x/sys/unix"
)

// CollectSystem gathers host system metadata on Unix systems.
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

	dist := detectLinuxDistro()

	memTotalMB := int64(0)
	if sysinfo.Totalram > 0 {
		memTotalMB = int64(sysinfo.Totalram) * int64(sysinfo.Unit) / (1024 * 1024)
	}

	return SystemInfo{
		Hostname:     hostname,
		OSType:       "linux",
		OSVersion:    dist,
		Kernel:       kernel,
		Architecture: arch(),
		UptimeSec:    uptime,
		CPUCount:     runtime.NumCPU(),
		MemTotalMB:   memTotalMB,
		InstalledAV:  detectAV(),
	}
}

func detectLinuxDistro() string {
	if data, err := os.ReadFile("/etc/os-release"); err == nil {
		for _, line := range strings.Split(string(data), "\n") {
			if strings.HasPrefix(line, "PRETTY_NAME=") {
				return strings.Trim(strings.TrimPrefix(line, "PRETTY_NAME="), `"`)
			}
		}
	}
	return "unknown"
}

func detectAV() []string {
	candidates := []string{
		"/usr/sbin/clamd", "/usr/bin/clamscan",
		"/opt/sophos-av/bin/savscand", "/opt/McAfee/ens/tp/mfeefw",
		"/usr/bin/freshclam", "/var/run/clamd.pid",
	}
	var found []string
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			found = append(found, filepath.Base(c))
		}
	}
	return found
}

func arch() string {
	var uts unix.Utsname
	if err := unix.Uname(&uts); err == nil {
		return unix.ByteSliceToString(uts.Machine[:])
	}
	return "unknown"
}

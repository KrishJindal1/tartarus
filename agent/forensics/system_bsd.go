//go:build darwin || freebsd || netbsd || openbsd

package forensics

import (
	"os"
	"runtime"
	"strings"
	"time"

	"golang.org/x/sys/unix"
)

// CollectSystem gathers host system metadata on non-Linux Unix systems.
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
	if tv, err := unix.SysctlTimeval("kern.boottime"); err == nil {
		uptime = time.Now().Unix() - tv.Sec
	}

	return SystemInfo{
		Hostname:     hostname,
		OSType:       runtime.GOOS,
		OSVersion:    detectBSDVersion(),
		Kernel:       kernel,
		Architecture: unix.ByteSliceToString(uts.Machine[:]),
		UptimeSec:    uptime,
		CPUCount:     runtime.NumCPU(),
	}
}

func detectBSDVersion() string {
	if data, err := os.ReadFile("/etc/os-release"); err == nil {
		for _, line := range strings.Split(string(data), "\n") {
			if strings.HasPrefix(line, "PRETTY_NAME=") {
				return strings.Trim(strings.TrimPrefix(line, "PRETTY_NAME="), `"`)
			}
		}
	}
	if data, err := os.ReadFile("/etc/version"); err == nil {
		return strings.TrimSpace(string(data))
	}
	return runtime.GOOS
}

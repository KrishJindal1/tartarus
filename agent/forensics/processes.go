//go:build !windows

package forensics

import (
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// CollectProcesses enumerates running processes via /proc and flags anomalies.
func CollectProcesses() []ProcessInfo {
	var result []ProcessInfo

	entries, err := os.ReadDir("/proc")
	if err != nil {
		return nil
	}

	for _, e := range entries {
		pid, err := strconv.Atoi(e.Name())
		if err != nil {
			continue
		}

		comm, _ := os.ReadFile(filepath.Join("/proc", e.Name(), "comm"))
		exe, _ := os.Readlink(filepath.Join("/proc", e.Name(), "exe"))
		cmdline, _ := os.ReadFile(filepath.Join("/proc", e.Name(), "cmdline"))

		ppid := 0
		if stat, err := os.ReadFile(filepath.Join("/proc", e.Name(), "stat")); err == nil {
			if i := strings.LastIndex(string(stat), ")"); i >= 0 {
				fields := strings.Fields(string(stat)[i+1:])
				if len(fields) >= 2 {
					ppid, _ = strconv.Atoi(fields[1])
				}
			}
		}

		memMB := 0.0
		if status, err := os.ReadFile(filepath.Join("/proc", e.Name(), "status")); err == nil {
			for _, line := range strings.Split(string(status), "\n") {
				if strings.HasPrefix(line, "VmRSS:") {
					fields := strings.Fields(line)
					if len(fields) >= 2 {
						kb, _ := strconv.ParseFloat(fields[1], 64)
						memMB = kb / 1024.0
					}
				}
			}
		}

		name := strings.TrimSpace(string(comm))
		if name == "" {
			name = strings.SplitN(strings.TrimSpace(string(cmdline)), "\x00", 2)[0]
		}

		info := ProcessInfo{
			PID:      pid,
			PPID:     ppid,
			Name:     name,
			ExePath:  exe,
			MemoryMB: memMB,
		}

		// Heuristics: deleted binary or executable living in tmp/shm
		if strings.Contains(exe, "(deleted)") ||
			strings.HasPrefix(exe, "/tmp/") ||
			strings.HasPrefix(exe, "/dev/shm/") {
			info.IsSuspicious = true
		}

		result = append(result, info)
	}
	return result
}

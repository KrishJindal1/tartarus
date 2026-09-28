//go:build !windows

package forensics

import (
	"os"
	"os/user"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// bootTimeSeconds reads the kernel boot epoch from /proc/stat (for start times).
func bootTimeSeconds() int64 {
	data, err := os.ReadFile("/proc/stat")
	if err != nil {
		return 0
	}
	for _, line := range strings.Split(string(data), "\n") {
		if strings.HasPrefix(line, "btime ") {
			if v, err := strconv.ParseInt(strings.TrimSpace(strings.TrimPrefix(line, "btime ")), 10, 64); err == nil {
				return v
			}
		}
	}
	return 0
}

// uidToName maps a numeric uid to the login name (best effort).
func uidToName(uid string) string {
	if u, err := user.LookupId(uid); err == nil && u.Username != "" {
		return u.Username
	}
	return uid
}

// CollectProcesses enumerates running processes via /proc and flags anomalies.
func CollectProcesses() []ProcessInfo {
	var result []ProcessInfo

	entries, err := os.ReadDir("/proc")
	if err != nil {
		return nil
	}
	btime := bootTimeSeconds()
	hz := int64(100) // sysconf(_SC_CLK_TCK) is 100 on Linux

	for _, e := range entries {
		pid, err := strconv.Atoi(e.Name())
		if err != nil {
			continue
		}

		comm, _ := os.ReadFile(filepath.Join("/proc", e.Name(), "comm"))
		exe, _ := os.Readlink(filepath.Join("/proc", e.Name(), "exe"))
		cmdlineBytes, _ := os.ReadFile(filepath.Join("/proc", e.Name(), "cmdline"))

		ppid := 0
		var startTime *time.Time
		if stat, err := os.ReadFile(filepath.Join("/proc", e.Name(), "stat")); err == nil {
			if i := strings.LastIndex(string(stat), ")"); i >= 0 {
				fields := strings.Fields(string(stat)[i+1:])
				if len(fields) >= 2 {
					ppid, _ = strconv.Atoi(fields[1])
				}
				// field 22 (starttime, clock ticks since boot) = index 19 after ')'
				if btime > 0 && len(fields) >= 20 {
					if ticks, err := strconv.ParseInt(fields[19], 10, 64); err == nil {
						t := time.Unix(btime+ticks/hz, (ticks%hz)*(1e9/hz))
						startTime = &t
					}
				}
			}
		}

		memMB := 0.0
		uid := ""
		if status, err := os.ReadFile(filepath.Join("/proc", e.Name(), "status")); err == nil {
			for _, line := range strings.Split(string(status), "\n") {
				if strings.HasPrefix(line, "VmRSS:") {
					fields := strings.Fields(line)
					if len(fields) >= 2 {
						kb, _ := strconv.ParseFloat(fields[1], 64)
						memMB = kb / 1024.0
					}
				} else if strings.HasPrefix(line, "Uid:") {
					fields := strings.Fields(line)
					if len(fields) >= 2 {
						uid = fields[1]
					}
				}
			}
		}

		name := strings.TrimSpace(string(comm))
		if name == "" {
			name = strings.SplitN(strings.TrimSpace(string(cmdlineBytes)), "\x00", 2)[0]
		}

		// cmdline is NUL-separated in /proc — render it space-separated.
		cmdline := strings.ReplaceAll(strings.TrimRight(string(cmdlineBytes), "\x00"), "\x00", " ")

		info := ProcessInfo{
			PID:       pid,
			PPID:      ppid,
			Name:      name,
			ExePath:   exe,
			CmdLine:   cmdline,
			User:      uidToName(uid),
			StartTime: startTime,
			MemoryMB:  memMB,
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

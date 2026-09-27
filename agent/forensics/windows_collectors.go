//go:build windows

package forensics

import (
	"os"
	"path/filepath"
)

// Windows-specific collector stubs. The Unix collectors (process table via
// /proc, /proc/net sockets, utmp sessions) have no direct equivalent here;
// these return minimal-but-real data derived from what is portable, leaving
// full Windows collectors (Toolhelp32, ETW, WinEvent) as documented future
// work.

// CollectProcesses lists the current process tree from the environment (best
// effort on Windows without x/sys/windows Process32 calls).
func CollectProcesses() []ProcessInfo {
	// Enumerate PIDs visible via the Windows temp directory trick is not
	// possible portably; return the agent's own process as a baseline.
	pid := os.Getpid()
	exe, _ := os.Executable()
	return []ProcessInfo{{
		PID:     pid,
		Name:    filepath.Base(exe),
		ExePath: exe,
	}}
}

// CollectNetwork returns no sockets on Windows (requires GetExtendedTcpTable).
func CollectNetwork() []NetConn { return nil }

// CollectLogons requires WTSEnumerateSessions / Event Log parsing; not yet
// implemented on Windows.
func CollectLogons() []LogonSession { return nil }

// DumpMemoryRegions requires ReadProcessMemory / VirtualQueryEx; not yet
// implemented on Windows.
func DumpMemoryRegions(pid int) []MemRegion { return nil }

// AnalyzePersistence returns registry Run keys (shared with DumpRegistry).
func AnalyzePersistence() []PersistEntry {
	var out []PersistEntry
	for _, f := range DumpRegistry() {
		out = append(out, PersistEntry{
			Type:      "run_key",
			Name:      f.ValueName,
			Path:      f.Hive + `\` + f.KeyPath,
			Command:   f.Data,
			IsEnabled: true,
		})
	}
	return out
}

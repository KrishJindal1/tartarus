//go:build !windows

package forensics

import (
	"os"
	"testing"
)

func TestCollectProcesses(t *testing.T) {
	procs := CollectProcesses()
	if len(procs) == 0 {
		t.Fatal("expected processes on linux")
	}
	// our own pid should be visible
	ours := os.Getpid()
	found := false
	for _, p := range procs {
		if p.PID == ours {
			found = true
		}
	}
	if !found {
		t.Fatalf("own pid %d not found", ours)
	}
}

func TestCollectSystem(t *testing.T) {
	sys := CollectSystem()
	if sys.Hostname == "" {
		t.Fatal("expected hostname")
	}
	if sys.OSType != "linux" {
		t.Fatalf("expected linux, got %q", sys.OSType)
	}
}

func TestCollectNetwork(t *testing.T) {
	conns := CollectNetwork()
	// in a running container there is usually at least the uvicorn socket
	t.Logf("collected %d connections", len(conns))
	for _, c := range conns {
		if c.Protocol == "" {
			t.Fatalf("empty protocol: %+v", c)
		}
	}
}

func TestDumpMemoryRegionsOwnPID(t *testing.T) {
	regions := DumpMemoryRegions(os.Getpid())
	if len(regions) == 0 {
		t.Fatal("expected mapped regions for own pid")
	}
}

func TestDumpMemoryRegionsAll(t *testing.T) {
	regions := DumpMemoryRegions(0)
	if len(regions) == 0 {
		t.Fatal("expected some notable regions system-wide")
	}
}

func TestAnalyzePersistence(t *testing.T) {
	entries := AnalyzePersistence()
	t.Logf("persistence entries: %d", len(entries))
	// /etc/crontab or profile.d usually exists; tolerate absence but no crash
	for _, e := range entries {
		if e.Type == "" {
			t.Fatalf("empty type: %+v", e)
		}
	}
}

func TestCollectFiles(t *testing.T) {
	arts := CollectFiles("/etc")
	if len(arts) == 0 {
		t.Log("no notable files in /etc (possible)")
	}
	for _, a := range arts {
		if a.Path == "" {
			t.Fatal("empty path")
		}
	}
}

func TestCollectLogons(t *testing.T) {
	logons := CollectLogons()
	t.Logf("logon sessions: %d", len(logons))
	for _, l := range logons {
		if l.Username == "" {
			t.Fatalf("empty username: %+v", l)
		}
	}
}

func TestDirectSyscallProbe(t *testing.T) {
	out := DirectSyscallProbe()
	pid, ok := out["syscall_pid"].(int64)
	if !ok {
		t.Fatalf("missing syscall_pid: %#v", out)
	}
	if int(pid) != os.Getpid() {
		t.Fatalf("syscall pid %d != %d", pid, os.Getpid())
	}
}

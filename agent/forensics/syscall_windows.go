//go:build windows

package forensics

import (
	"runtime"
	"syscall"
	"time"
)

// DirectSyscallProbe on Windows performs a raw syscall-based identity probe
// (GetCurrentProcessId / GetCurrentThreadId via kernel32, no disk artifacts).
func DirectSyscallProbe() map[string]any {
	k32 := syscall.NewLazyDLL("kernel32.dll")
	pidProc := k32.NewProc("GetCurrentProcessId")
	tidProc := k32.NewProc("GetCurrentThreadId")
	pid, _, _ := pidProc.Call()
	tid, _, _ := tidProc.Call()
	return map[string]any{
		"syscall_pid": int64(pid),
		"syscall_tid": int64(tid),
		"method":      "raw syscall (kernel32)",
		"note":        "read-only identity probe; no process injection performed",
		"goos":        runtime.GOOS,
		"tick":        time.Now().Unix(),
	}
}

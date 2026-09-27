//go:build !windows

package forensics

import "golang.org/x/sys/unix"

// DirectSyscallProbe issues a couple of raw syscalls (no libc, no disk) as a
// demonstration of the agent's direct-syscall capability for forensics
// primitives. It only performs read-only identity queries.
func DirectSyscallProbe() map[string]any {
	pid, _, errno := unix.Syscall(unix.SYS_GETPID, 0, 0, 0)
	uid, _, errno2 := unix.Syscall(unix.SYS_GETUID, 0, 0, 0)
	return map[string]any{
		"syscall_pid":  int64(pid),
		"syscall_uid":  int64(uid),
		"errno_getpid": int64(errno),
		"errno_getuid": int64(errno2),
		"method":       "raw syscall (no libc)",
		"note":         "read-only identity probe; no process injection performed",
	}
}

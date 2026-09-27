//go:build windows

package forensics

import (
	"os"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"unsafe"
)

type osVersionInfoExW struct {
	OSVersionInfoSize uint32
	OSVersionMajor    uint32
	OSVersionMinor    uint32
	BuildNumber       uint32
	PlatformID        uint32
	CSDVersion        [128]uint16
	ServicePackMajor  uint16
	ServicePackMinor  uint16
	SuiteMask         uint16
	ProductType       byte
	Reserved          byte
}

// CollectSystem gathers host system metadata on Windows.
func CollectSystem() SystemInfo {
	hostname, _ := os.Hostname()

	ntdll := syscall.NewLazyDLL("ntdll.dll")
	rver := ntdll.NewProc("RtlGetVersion")
	var info osVersionInfoExW
	info.OSVersionInfoSize = uint32(unsafe.Sizeof(info))
	rver.Call(uintptr(unsafe.Pointer(&info)))

	k32 := syscall.NewLazyDLL("kernel32.dll")
	tick, _, _ := k32.NewProc("GetTickCount64").Call()

	return SystemInfo{
		Hostname:     hostname,
		OSType:       "windows",
		OSVersion:    formatWinVersion(info.OSVersionMajor, info.OSVersionMinor, info.BuildNumber),
		Kernel:       "ntdll",
		Architecture: runtime.GOARCH,
		UptimeSec:    int64(tick) / 1000,
		InstalledAV:  detectAVWindows(),
	}
}

func formatWinVersion(major, minor, build uint32) string {
	base := "Windows"
	switch {
	case major == 10 && build >= 22000:
		base = "Windows 11"
	case major == 10:
		base = "Windows 10"
	case major == 6 && minor == 3:
		base = "Windows 8.1"
	case major == 6 && minor == 2:
		base = "Windows 8"
	case major == 6 && minor == 1:
		base = "Windows 7"
	}
	return base + " " + strconv.FormatUint(uint64(major), 10) + "." +
		strconv.FormatUint(uint64(minor), 10) + "." +
		strconv.FormatUint(uint64(build), 10)
}

// detectAVWindows checks common AV product locations.
func detectAVWindows() []string {
	var found []string
	if _, err := os.Stat(`C:\Windows\System32\MsMpEng.exe`); err == nil {
		found = append(found, "Windows Defender")
	}
	if _, err := os.Stat(`C:\Program Files\Malwarebytes`); err == nil {
		found = append(found, "Malwarebytes")
	}
	_ = strings.TrimSpace
	return found
}

//go:build windows

package forensics

import (
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strconv"
	"syscall"
	"unsafe"

	"golang.org/x/sys/windows/registry"
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

type memoryStatusEx struct {
	Length               uint32
	MemoryLoad           uint32
	TotalPhys            uint64
	AvailPhys            uint64
	TotalPageFile        uint64
	AvailPageFile        uint64
	TotalVirtual         uint64
	AvailVirtual         uint64
	AvailExtendedVirtual uint64
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

	memTotalMB := int64(0)
	var memSTATEX memoryStatusEx
	memSTATEX.Length = uint32(unsafe.Sizeof(memSTATEX))
	if ok, _, _ := k32.NewProc("GlobalMemoryStatusEx").Call(uintptr(unsafe.Pointer(&memSTATEX))); ok != 0 {
		memTotalMB = int64(memSTATEX.TotalPhys) / (1024 * 1024)
	}

	return SystemInfo{
		Hostname:     hostname,
		OSType:       "windows",
		OSVersion:    formatWinVersion(info.OSVersionMajor, info.OSVersionMinor, info.BuildNumber),
		Kernel:       "ntdll",
		Architecture: runtime.GOARCH,
		UptimeSec:    int64(tick) / 1000,
		CPUCount:     runtime.NumCPU(),
		MemTotalMB:   memTotalMB,
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

// detectAVWindows checks service state and common AV product locations.
func detectAVWindows() []string {
	found := map[string]bool{}

	// Windows Defender: System32 binary, Defender Platform updates, or the
	// WinDefend service (present even when the binary only lives under
	// ProgramData\Microsoft\Windows Defender\Platform\<version>\MsMpEng.exe).
	if _, err := os.Stat(`C:\Windows\System32\MsMpEng.exe`); err == nil {
		found["Windows Defender"] = true
	}
	if matches, _ := filepath.Glob(`C:\ProgramData\Microsoft\Windows Defender\Platform\*\MsMpEng.exe`); len(matches) > 0 {
		found["Windows Defender"] = true
	}
	if k, err := registry.OpenKey(registry.LOCAL_MACHINE,
		`SYSTEM\CurrentControlSet\Services\WinDefend`, registry.QUERY_VALUE); err == nil {
		k.Close()
		found["Windows Defender"] = true
	}

	// Other vendors: check their Program Files directories.
	type vendor struct{ name, rel string }
	vendors := []vendor{
		{"Malwarebytes", `Malwarebytes`},
		{"Sophos", `Sophos`},
		{"Kaspersky", `Kaspersky Lab`},
		{"Avast", `Avast Software`},
		{"AVG", `AVG`},
		{"ESET", `ESET`},
		{"Bitdefender", `Bitdefender`},
		{"Norton", `Norton`},
		{"McAfee", `McAfee`},
		{"CrowdStrike", `CrowdStrike`},
		{"SentinelOne", `SentinelOne`},
		{"Trend Micro", `Trend Micro`},
	}
	roots := []string{
		os.Getenv("ProgramFiles"),
		os.Getenv("ProgramFiles(x86)"),
		`C:\Program Files`,
		`C:\Program Files (x86)`,
	}
	for _, v := range vendors {
		for _, root := range roots {
			if root == "" {
				continue
			}
			if _, err := os.Stat(filepath.Join(root, v.rel)); err == nil {
				found[v.name] = true
				break
			}
		}
	}

	out := make([]string, 0, len(found))
	for name := range found {
		out = append(out, name)
	}
	sort.Strings(out)
	return out
}

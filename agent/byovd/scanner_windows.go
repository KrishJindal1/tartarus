//go:build windows

package byovd

import (
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"io"
	"os"
	"path/filepath"
	"strings"
	"unsafe"

	"golang.org/x/sys/windows"
)

// Windows loaded-driver enumeration notes:
//   - K32EnumDeviceDrivers returns TRUE but zeroed addresses for processes
//     without SeDebugPrivilege, so we use NtQuerySystemInformation
//     (SystemModuleInformation), which works in user mode: it reports module
//     paths (and redacts image bases on modern builds — we don't need them).
//   - x64 layout: u64 count (8 bytes) then 296-byte entries with the
//     full NT path at entry+40 (FullPathName[256]).
const (
	sysModuleInformation = 11
	sysModuleHeaderSize  = 8
	sysModuleEntrySize   = 296
	sysModuleNameOffset  = 40
	sysModuleNameLen     = 256
)

var (
	ntdll                 = windows.NewLazySystemDLL("ntdll.dll")
	procNtQuerySystemInfo = ntdll.NewProc("NtQuerySystemInformation")
)

// ScanLoadedDrivers enumerates loaded kernel modules and checks their file
// names against the BYOVD intelligence list. Detection-only: the agent
// reports vulnerable drivers for takedown/remediation and never manipulates
// driver callbacks.
func ScanLoadedDrivers() []DriverFinding {
	findings := []DriverFinding{}
	if err := procNtQuerySystemInfo.Find(); err != nil {
		return findings
	}

	var size uint32
	for attempt := 0; attempt < 3; attempt++ {
		if size == 0 {
			// STATUS_INFO_LENGTH_MISMATCH (0xC0000004) fills in the needed size.
			procNtQuerySystemInfo.Call(sysModuleInformation, 0, 0,
				uintptr(unsafe.Pointer(&size)))
			if size == 0 {
				return findings
			}
		}
		buf := make([]byte, size+4096)
		status, _, _ := procNtQuerySystemInfo.Call(sysModuleInformation,
			uintptr(unsafe.Pointer(&buf[0])), uintptr(len(buf)),
			uintptr(unsafe.Pointer(&size)))
		if status != 0 {
			continue // e.g. buffer raced smaller — retry with updated size
		}
		return matchDriverIntel(buf)
	}
	return findings
}

// matchDriverIntel walks the SystemModuleInformation buffer and returns the
// findings for any loaded module whose file name is on the intel list.
func matchDriverIntel(buf []byte) []DriverFinding {
	findings := []DriverFinding{}
	if len(buf) < sysModuleHeaderSize+sysModuleEntrySize {
		return findings
	}
	count := int(binary.LittleEndian.Uint64(buf[0:8]))
	seen := map[string]bool{}
	for i := 0; i < count; i++ {
		off := sysModuleHeaderSize + i*sysModuleEntrySize
		if off+sysModuleEntrySize > len(buf) {
			break
		}
		path := cstr(buf[off+sysModuleNameOffset : off+sysModuleNameOffset+sysModuleNameLen])
		if path == "" {
			continue
		}
		baseName := path
		if j := strings.LastIndexByte(baseName, '\\'); j >= 0 {
			baseName = baseName[j+1:]
		}
		intel, ok := lookupDriverIntel(baseName)
		if !ok || seen[strings.ToLower(baseName)] {
			continue
		}
		seen[strings.ToLower(baseName)] = true

		finding := DriverFinding{
			Name:     strings.ToLower(baseName),
			CVE:      intel.CVE,
			Impact:   intel.Impact,
			Severity: intel.Severity,
			Notes:    intel.Notes,
		}
		if resolved := resolveDriverPath(path, finding.Name); resolved != "" {
			finding.Path = resolved
			if sum, err := fileSHA256(resolved); err == nil {
				finding.SHA256 = sum
			}
		}
		findings = append(findings, finding)
	}
	return findings
}

// cstr reads a NUL-terminated byte string.
func cstr(b []byte) string {
	if i := strings.IndexByte(string(b), 0); i >= 0 {
		return string(b[:i])
	}
	return string(b)
}

// resolveDriverPath normalizes the kernel's device-path form
// (\SystemRoot\..., \??\C:\...) into a stat-able file path, falling back to
// System32\drivers\<base>.
func resolveDriverPath(raw, baseName string) string {
	raw = strings.TrimPrefix(raw, `\??\`)
	lower := strings.ToLower(raw)
	sysRoot := os.Getenv("SystemRoot")
	if sysRoot == "" {
		sysRoot = `C:\Windows`
	}
	switch {
	case strings.HasPrefix(lower, `\systemroot\`):
		raw = filepath.Join(sysRoot, raw[len(`\SystemRoot\`):])
	case strings.HasPrefix(lower, `\windows\`):
		raw = filepath.Join(sysRoot, raw[1:])
	case strings.HasPrefix(lower, `\device\harddiskvolume`):
		raw = "" // volume-mapped; use the drivers-dir fallback
	}
	if raw != "" {
		if _, err := os.Stat(raw); err == nil {
			return raw
		}
	}
	fallback := filepath.Join(sysRoot, "System32", "drivers", baseName)
	if _, err := os.Stat(fallback); err == nil {
		return fallback
	}
	return ""
}

func fileSHA256(path string) (string, error) {
	fh, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer fh.Close()
	h := sha256.New()
	if _, err := io.Copy(h, fh); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

//go:build windows

package forensics

import (
	"encoding/binary"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strings"
	"time"
	"unsafe"

	"golang.org/x/sys/windows"
	"golang.org/x/sys/windows/registry"
)

// Native Windows collectors (Toolhelp32, GetExtendedTcpTable, WTS sessions,
// VirtualQueryEx) replacing the previous portable-but-empty stubs.

var (
	modIphlpapi                     = windows.NewLazySystemDLL("iphlpapi.dll")
	procGetExtendedTcpTable         = modIphlpapi.NewProc("GetExtendedTcpTable")
	procGetExtendedUdpTable         = modIphlpapi.NewProc("GetExtendedUdpTable")
	modPsapi                        = windows.NewLazySystemDLL("psapi.dll")
	procGetProcessMemoryInfo        = modPsapi.NewProc("GetProcessMemoryInfo")
	modWtsapi                       = windows.NewLazySystemDLL("wtsapi32.dll")
	procWTSQuerySessionInformationW = modWtsapi.NewProc("WTSQuerySessionInformationW")
)

// WTS information classes (wtsapi32.h WTS_INFO_CLASS).
const (
	wtsUserName        = 5
	wtsDomainName      = 7
	wtsClientName      = 10
	wtsClientAddress   = 14
	afInet             = 2
	afInet6            = 23
	memImage           = 0x01000000
	memMapped          = 0x00040000
	memPrivate         = 0x00020000
	maxMemRegions      = 512
	tcpTableOwnerPID   = 5 // TCP_TABLE_OWNER_PID_ALL
	udpTableOwnerPID   = 1 // UDP_TABLE_OWNER_PID
)

var tcpStatesByNumber = map[uint32]string{
	1: "ESTABLISHED", 2: "SYN_SENT", 3: "SYN_RECV", 4: "FIN_WAIT1",
	5: "FIN_WAIT2", 6: "TIME_WAIT", 7: "CLOSE", 8: "CLOSE_WAIT",
	9: "LAST_ACK", 10: "LISTEN", 11: "CLOSING",
}

var wtsStates = map[uint32]string{
	0: "active", 1: "connected", 2: "connect_query", 3: "shadow",
	4: "disconnected", 5: "idle", 6: "listen", 7: "reset", 8: "down", 9: "init",
}

// ---------------- processes ----------------

// processNameMap returns pid → executable name via a Toolhelp32 snapshot.
func processNameMap() map[uint32]string {
	m := make(map[uint32]string)
	snap, err := windows.CreateToolhelp32Snapshot(windows.TH32CS_SNAPPROCESS, 0)
	if err != nil {
		return m
	}
	defer windows.CloseHandle(snap)
	var pe windows.ProcessEntry32
	pe.Size = uint32(unsafe.Sizeof(pe))
	for err := windows.Process32First(snap, &pe); err == nil; err = windows.Process32Next(snap, &pe) {
		m[pe.ProcessID] = windows.UTF16ToString(pe.ExeFile[:])
	}
	return m
}

// processImagePath resolves the full image path for a PID (best effort).
func processImagePath(pid uint32) string {
	h, err := windows.OpenProcess(windows.PROCESS_QUERY_LIMITED_INFORMATION, false, pid)
	if err != nil {
		return ""
	}
	defer windows.CloseHandle(h)
	buf := make([]uint16, 320)
	size := uint32(len(buf))
	if err := windows.QueryFullProcessImageName(h, 0, &buf[0], &size); err != nil {
		return ""
	}
	return windows.UTF16ToString(buf[:size])
}

// workingSetMB reports the process working set in MB (0 if inaccessible).
func workingSetMB(pid uint32) float64 {
	type processMemoryCounters struct {
		CB                         uint32
		PageFaultCount             uint32
		PeakWorkingSetSize         uintptr
		WorkingSetSize             uintptr
		QuotaPeakPagedPoolUsage    uintptr
		QuotaPagedPoolUsage        uintptr
		QuotaPeakNonPagedPoolUsage uintptr
		QuotaNonPagedPoolUsage     uintptr
		PagefileUsage              uintptr
		PeakPagefileUsage          uintptr
	}
	h, err := windows.OpenProcess(windows.PROCESS_QUERY_INFORMATION|windows.PROCESS_VM_READ, false, pid)
	if err != nil {
		return 0
	}
	defer windows.CloseHandle(h)
	var pmc processMemoryCounters
	pmc.CB = uint32(unsafe.Sizeof(pmc))
	r1, _, _ := procGetProcessMemoryInfo.Call(uintptr(h), uintptr(unsafe.Pointer(&pmc)), uintptr(pmc.CB))
	if r1 == 0 {
		return 0
	}
	return float64(pmc.WorkingSetSize) / (1024 * 1024)
}

// CollectProcesses enumerates the process table via Toolhelp32.
func CollectProcesses() []ProcessInfo {
	snap, err := windows.CreateToolhelp32Snapshot(windows.TH32CS_SNAPPROCESS, 0)
	if err != nil {
		return nil
	}
	defer windows.CloseHandle(snap)

	var out []ProcessInfo
	var pe windows.ProcessEntry32
	pe.Size = uint32(unsafe.Sizeof(pe))
	for err := windows.Process32First(snap, &pe); err == nil; err = windows.Process32Next(snap, &pe) {
		name := windows.UTF16ToString(pe.ExeFile[:])
		exe := processImagePath(pe.ProcessID)
		info := ProcessInfo{
			PID:      int(pe.ProcessID),
			PPID:     int(pe.ParentProcessID),
			Name:     name,
			ExePath:  exe,
			MemoryMB: workingSetMB(pe.ProcessID),
		}
		lower := strings.ToLower(exe)
		if strings.Contains(lower, `\temp\`) ||
			strings.Contains(lower, `\appdata\local\temp\`) ||
			strings.Contains(lower, `\users\public\`) ||
			strings.Contains(lower, `\downloads\`) {
			info.IsSuspicious = true
		}
		out = append(out, info)
	}
	return out
}

// ---------------- network ----------------

// queryExtendedTable wraps GetExtendedTcpTable / GetExtendedUdpTable.
func queryExtendedTable(proc *windows.LazyProc, af, tableClass uint32) ([]byte, error) {
	var size uint32
	for i := 0; i < 3; i++ {
		if size == 0 {
			// sizing call: expected to fail with ERROR_INSUFFICIENT_BUFFER
			proc.Call(0, uintptr(unsafe.Pointer(&size)), 0, uintptr(af), uintptr(tableClass), 0)
			if size == 0 {
				return nil, fmt.Errorf("table size query returned no size")
			}
		}
		buf := make([]byte, size)
		r1, _, _ := proc.Call(
			uintptr(unsafe.Pointer(&buf[0])),
			uintptr(unsafe.Pointer(&size)),
			0, uintptr(af), uintptr(tableClass), 0,
		)
		if r1 == 0 {
			return buf, nil
		}
		if uintptr(r1) != uintptr(windows.ERROR_INSUFFICIENT_BUFFER) {
			return nil, fmt.Errorf("table query failed: code %d", r1)
		}
	}
	return nil, fmt.Errorf("table query buffer kept growing")
}

// ntohs32 converts a network-byte-order port word to a host port number.
func ntohs32(v uint32) int {
	return int(((v>>8)&0xff | (v<<8)&0xff00))
}

// ipv4FromWord renders a network-order IPv4 word (as stored by iphlpapi).
func ipv4FromWord(v uint32) string {
	return net.IPv4(byte(v), byte(v>>8), byte(v>>16), byte(v>>24)).String()
}

func tableRows(buf []byte, rowSize int) [][]byte {
	if len(buf) < 4 {
		return nil
	}
	n := int(binary.LittleEndian.Uint32(buf[:4]))
	rows := make([][]byte, 0, n)
	off := 4
	for i := 0; i < n && off+rowSize <= len(buf); i++ {
		rows = append(rows, buf[off:off+rowSize])
		off += rowSize
	}
	return rows
}

// CollectNetwork lists TCP/UDP endpoints (IPv4 + IPv6) with owning PIDs.
func CollectNetwork() []NetConn {
	names := processNameMap()
	var out []NetConn

	add := func(protocol, lAddr string, lPort int, rAddr string, rPort int, state string, pid uint32) {
		conn := NetConn{
			Protocol:   protocol,
			LocalAddr:  lAddr,
			LocalPort:  lPort,
			RemoteAddr: rAddr,
			RemotePort: rPort,
			State:      state,
			PID:        int(pid),
		}
		if pid > 0 {
			conn.Process = names[pid]
		}
		out = append(out, conn)
	}

	// TCP IPv4
	if buf, err := queryExtendedTable(procGetExtendedTcpTable, windows.AF_INET, tcpTableOwnerPID); err == nil {
		for _, row := range tableRows(buf, 24) {
			state := tcpStatesByNumber[binary.LittleEndian.Uint32(row[0:4])]
			lAddr := ipv4FromWord(binary.LittleEndian.Uint32(row[4:8]))
			lPort := ntohs32(binary.LittleEndian.Uint32(row[8:12]))
			rAddr := ipv4FromWord(binary.LittleEndian.Uint32(row[12:16]))
			rPort := ntohs32(binary.LittleEndian.Uint32(row[16:20]))
			pid := binary.LittleEndian.Uint32(row[20:24])
			add("tcp", lAddr, lPort, rAddr, rPort, state, pid)
		}
	}
	// TCP IPv6
	if buf, err := queryExtendedTable(procGetExtendedTcpTable, windows.AF_INET6, tcpTableOwnerPID); err == nil {
		for _, row := range tableRows(buf, 56) {
			state := tcpStatesByNumber[binary.LittleEndian.Uint32(row[0:4])]
			lAddr := net.IP(row[4:20]).String()
			lPort := ntohs32(binary.LittleEndian.Uint32(row[24:28]))
			rAddr := net.IP(row[28:44]).String()
			rPort := ntohs32(binary.LittleEndian.Uint32(row[48:52]))
			pid := binary.LittleEndian.Uint32(row[52:56])
			add("tcp6", lAddr, lPort, rAddr, rPort, state, pid)
		}
	}
	// UDP IPv4
	if buf, err := queryExtendedTable(procGetExtendedUdpTable, windows.AF_INET, udpTableOwnerPID); err == nil {
		for _, row := range tableRows(buf, 12) {
			lAddr := ipv4FromWord(binary.LittleEndian.Uint32(row[0:4]))
			lPort := ntohs32(binary.LittleEndian.Uint32(row[4:8]))
			pid := binary.LittleEndian.Uint32(row[8:12])
			add("udp", lAddr, lPort, "0.0.0.0", 0, "OPEN", pid)
		}
	}
	// UDP IPv6
	if buf, err := queryExtendedTable(procGetExtendedUdpTable, windows.AF_INET6, udpTableOwnerPID); err == nil {
		for _, row := range tableRows(buf, 28) {
			lAddr := net.IP(row[0:16]).String()
			lPort := ntohs32(binary.LittleEndian.Uint32(row[20:24]))
			pid := binary.LittleEndian.Uint32(row[24:28])
			add("udp6", lAddr, lPort, "::", 0, "OPEN", pid)
		}
	}
	return out
}

// ---------------- logon sessions ----------------

// wtsQueryStr fetches a string info class for a session via WTSQuerySessionInformationW.
func wtsQueryStr(sessionID, infoClass uint32) string {
	var buf *uint16
	var bytes uint32
	r1, _, _ := procWTSQuerySessionInformationW.Call(
		0, uintptr(sessionID), uintptr(infoClass),
		uintptr(unsafe.Pointer(&buf)), uintptr(unsafe.Pointer(&bytes)),
	)
	if r1 == 0 || buf == nil {
		return ""
	}
	defer windows.WTSFreeMemory(uintptr(unsafe.Pointer(buf)))
	return windows.UTF16PtrToString(buf)
}

// wtsClientIP parses WTS_CLIENT_ADDRESS for a session (best effort).
func wtsClientIP(sessionID uint32) string {
	var buf *uint16
	var bytes uint32
	r1, _, _ := procWTSQuerySessionInformationW.Call(
		0, uintptr(sessionID), uintptr(wtsClientAddress),
		uintptr(unsafe.Pointer(&buf)), uintptr(unsafe.Pointer(&bytes)),
	)
	if r1 == 0 || buf == nil || bytes < 8 {
		return ""
	}
	defer windows.WTSFreeMemory(uintptr(unsafe.Pointer(buf)))
	raw := unsafe.Slice((*byte)(unsafe.Pointer(buf)), bytes)
	family := binary.LittleEndian.Uint32(raw[0:4])
	switch family {
	case afInet:
		if len(raw) >= 6 {
			// IP is offset by two bytes: 0x00 0x00 a.b.c.d
			return fmt.Sprintf("%d.%d.%d.%d", raw[2], raw[3], raw[4], raw[5])
		}
	case afInet6:
		if len(raw) >= 20 {
			return net.IP(raw[4:20]).String()
		}
	}
	return ""
}

// CollectLogons lists interactive/RDP sessions via WTSEnumerateSessions.
func CollectLogons() []LogonSession {
	var sessions *windows.WTS_SESSION_INFO
	var count uint32
	if err := windows.WTSEnumerateSessions(0, 0, 1, &sessions, &count); err != nil {
		return nil
	}
	defer windows.WTSFreeMemory(uintptr(unsafe.Pointer(sessions)))
	infos := unsafe.Slice(sessions, int(count))

	var out []LogonSession
	for _, s := range infos {
		user := wtsQueryStr(s.SessionID, wtsUserName)
		if user == "" {
			continue // session with no logged-on user
		}
		domain := wtsQueryStr(s.SessionID, wtsDomainName)
		srcIP := wtsClientIP(s.SessionID)

		stateName := wtsStates[s.State]
		logonType := stateName
		if srcIP != "" {
			logonType = "remote"
		} else if s.State == windows.WTSActive {
			logonType = "local"
		}
		lowerUser := strings.ToLower(user)
		out = append(out, LogonSession{
			SessionID:   fmt.Sprintf("%d", s.SessionID),
			Username:    user,
			Domain:      domain,
			LogonType:   logonType,
			LogonTime:   time.Time{}, // WTS exposes no logon timestamp
			SourceIP:    srcIP,
			IsPrivilege: lowerUser == "administrator" || lowerUser == "admin" || lowerUser == "root",
		})
	}
	return out
}

// ---------------- memory regions ----------------

func protectString(p uint32) string {
	var base string
	switch p & 0xff {
	case windows.PAGE_NOACCESS:
		base = "NONE"
	case windows.PAGE_READONLY:
		base = "R"
	case windows.PAGE_READWRITE:
		base = "RW"
	case windows.PAGE_WRITECOPY:
		base = "RWC"
	case windows.PAGE_EXECUTE:
		base = "X"
	case windows.PAGE_EXECUTE_READ:
		base = "RX"
	case windows.PAGE_EXECUTE_READWRITE:
		base = "RWX"
	case windows.PAGE_EXECUTE_WRITECOPY:
		base = "RWCX"
	default:
		base = fmt.Sprintf("0x%X", p)
	}
	if p&windows.PAGE_GUARD != 0 {
		base += "|GUARD"
	}
	if p&windows.PAGE_NOCACHE != 0 {
		base += "|NOCACHE"
	}
	return base
}

func regionTypeString(t uint32) string {
	switch t {
	case memImage:
		return "image"
	case memMapped:
		return "mapped"
	case memPrivate:
		return "private"
	default:
		return fmt.Sprintf("0x%X", t)
	}
}

// DumpMemoryRegions walks committed regions of a process via VirtualQueryEx.
func DumpMemoryRegions(pid int) []MemRegion {
	if pid <= 0 {
		pid = os.Getpid()
	}
	h, err := windows.OpenProcess(
		windows.PROCESS_QUERY_INFORMATION|windows.PROCESS_VM_READ, false, uint32(pid),
	)
	if err != nil {
		return nil
	}
	defer windows.CloseHandle(h)

	var out []MemRegion
	var mbi windows.MemoryBasicInformation
	addr := uintptr(0)
	for len(out) < maxMemRegions {
		err := windows.VirtualQueryEx(h, addr, &mbi, unsafe.Sizeof(mbi))
		if err != nil {
			break
		}
		if mbi.State == windows.MEM_COMMIT && mbi.RegionSize > 0 {
			out = append(out, MemRegion{
				PID:         pid,
				BaseAddress: fmt.Sprintf("0x%X", mbi.BaseAddress),
				RegionSize:  int64(mbi.RegionSize),
				Permissions: protectString(mbi.Protect),
				Mapping:     regionTypeString(mbi.Type),
			})
		}
		next := mbi.BaseAddress + mbi.RegionSize
		if next <= addr {
			break // address space end or zero-sized region
		}
		addr = next
	}
	return out
}

// ---------------- persistence ----------------

func registryString(hive registry.Key, path, value string) (string, bool) {
	k, err := registry.OpenKey(hive, path, registry.QUERY_VALUE)
	if err != nil {
		return "", false
	}
	defer k.Close()
	v, _, err := k.GetStringValue(value)
	if err != nil {
		return "", false
	}
	return v, true
}

var startupSuspiciousExts = map[string]bool{
	".exe": true, ".dll": true, ".bat": true, ".cmd": true, ".ps1": true,
	".vbs": true, ".js": true, ".scr": true, ".wsf": true, ".vbe": true,
}

// AnalyzePersistence covers Run keys, Winlogon customization, IFEO debuggers
// and user/common Startup folder entries.
func AnalyzePersistence() []PersistEntry {
	var out []PersistEntry

	// Registry Run / RunOnce keys (shared with DumpRegistry)
	for _, f := range DumpRegistry() {
		out = append(out, PersistEntry{
			Type:      "run_key",
			Name:      f.ValueName,
			Path:      f.Hive + `\` + f.KeyPath,
			Command:   f.Data,
			IsEnabled: true,
		})
	}

	// Winlogon shell / userinit overrides
	const winlogonPath = `Software\Microsoft\Windows NT\CurrentVersion\Winlogon`
	if v, ok := registryString(registry.LOCAL_MACHINE, winlogonPath, "Userinit"); ok {
		if !strings.EqualFold(strings.TrimSuffix(v, ","), `C:\Windows\system32\userinit.exe,`) &&
			!strings.EqualFold(strings.TrimSuffix(v, ","), `C:\Windows\System32\userinit.exe`) {
			out = append(out, PersistEntry{
				Type:        "winlogon_userinit",
				Name:        "Userinit",
				Path:        `HKLM\` + winlogonPath,
				Command:     v,
				IsEnabled:   true,
				RiskFinding: "non-default Winlogon Userinit",
			})
		} else {
			out = append(out, PersistEntry{
				Type:      "winlogon_userinit",
				Name:      "Userinit",
				Path:      `HKLM\` + winlogonPath,
				Command:   v,
				IsEnabled: true,
			})
		}
	}
	if v, ok := registryString(registry.LOCAL_MACHINE, winlogonPath, "Shell"); ok {
		entry := PersistEntry{
			Type:      "winlogon_shell",
			Name:      "Shell",
			Path:      `HKLM\` + winlogonPath,
			Command:   v,
			IsEnabled: true,
		}
		if !strings.EqualFold(v, "explorer.exe") {
			entry.RiskFinding = "customized Winlogon Shell"
		}
		out = append(out, entry)
	}

	// Image File Execution Options debugger hijacks
	const ifeoPath = `Software\Microsoft\Windows NT\CurrentVersion\Image File Execution Options`
	if k, err := registry.OpenKey(registry.LOCAL_MACHINE, ifeoPath, registry.ENUMERATE_SUB_KEYS|registry.QUERY_VALUE); err == nil {
		if targets, err := k.ReadValueNames(-1); err == nil {
			for _, t := range targets {
				sub, err := registry.OpenKey(k, t, registry.QUERY_VALUE)
				if err != nil {
					continue
				}
				dbg, _, derr := sub.GetStringValue("Debugger")
				sub.Close()
				if derr == nil && dbg != "" {
					out = append(out, PersistEntry{
						Type:        "ifeo_debugger",
						Name:        t,
						Path:        `HKLM\` + ifeoPath + `\` + t,
						Command:     dbg,
						IsEnabled:   true,
						RiskFinding: "IFEO Debugger attached to " + t,
					})
				}
			}
		}
		k.Close()
	}

	// Startup folder entries (per-user + common)
	startupDirs := []string{
		filepath.Join(os.Getenv("APPDATA"), `Microsoft\Windows\Start Menu\Programs\Startup`),
		filepath.Join(os.Getenv("ProgramData"), `Microsoft\Windows\Start Menu\Programs\StartUp`),
	}
	for _, dir := range startupDirs {
		if dir == "" || strings.HasPrefix(dir, `Microsoft\Windows`) {
			continue
		}
		entries, err := os.ReadDir(dir)
		if err != nil {
			continue
		}
		for _, e := range entries {
			if e.IsDir() {
				continue
			}
			full := filepath.Join(dir, e.Name())
			entry := PersistEntry{
				Type:      "startup_folder",
				Name:      e.Name(),
				Path:      dir,
				Command:   full,
				IsEnabled: true,
			}
			if startupSuspiciousExts[strings.ToLower(filepath.Ext(e.Name()))] {
				entry.RiskFinding = "script/executable in Startup folder: " + e.Name()
			}
			out = append(out, entry)
		}
	}
	return out
}

//go:build !windows

package forensics

import (
	"bufio"
	"encoding/binary"
	"fmt"
	"net"
	"os"
	"strconv"
	"strings"
)

var tcpStates = map[string]string{
	"01": "ESTABLISHED", "02": "SYN_SENT", "03": "SYN_RECV", "04": "FIN_WAIT1",
	"05": "FIN_WAIT2", "06": "TIME_WAIT", "07": "CLOSE", "08": "CLOSE_WAIT",
	"09": "LAST_ACK", "0A": "LISTEN", "0B": "CLOSING",
}

// CollectNetwork inspects open sockets via /proc/net/{tcp,tcp6,udp,udp6}.
func CollectNetwork() []NetConn {
	var result []NetConn
	for _, f := range []string{"/proc/net/tcp", "/proc/net/tcp6"} {
		result = append(result, parseProcNet(f, "tcp")...)
	}
	for _, f := range []string{"/proc/net/udp", "/proc/net/udp6"} {
		result = append(result, parseProcNet(f, "udp")...)
	}
	return result
}

func parseProcNet(path, proto string) []NetConn {
	var out []NetConn
	fh, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer fh.Close()

	scanner := bufio.NewScanner(fh)
	first := true
	for scanner.Scan() {
		if first { // header line
			first = false
			continue
		}
		fields := strings.Fields(scanner.Text())
		if len(fields) < 10 {
			continue
		}
		lAddr, lPort := splitAddr(fields[1])
		rAddr, rPort := splitAddr(fields[2])
		state := tcpStates[fields[3]]
		if proto == "udp" {
			state = "OPEN"
		}
		pid := lookupSocketPID(fields[9])
		out = append(out, NetConn{
			Protocol:   proto,
			LocalAddr:  lAddr,
			LocalPort:  lPort,
			RemoteAddr: rAddr,
			RemotePort: rPort,
			State:      state,
			PID:        pid,
		})
	}
	return out
}

func splitAddr(s string) (string, int) {
	parts := strings.Split(s, ":")
	if len(parts) != 2 {
		return s, 0
	}
	ip := decodeHexIP(parts[0])
	port, _ := strconv.Atoi(parts[1])
	return ip, port
}

func decodeHexIP(hexStr string) string {
	b, err := strconv.ParseUint(hexStr, 16, 32)
	if err != nil {
		return hexStr
	}
	// little-endian IPv4
	raw := make([]byte, 4)
	binary.LittleEndian.PutUint32(raw, uint32(b))
	return net.IP(raw).String()
}

// lookupSocketPID maps an inode to a PID by scanning /proc/*/fd (best effort).
func lookupSocketPID(inode string) int {
	if inode == "" {
		return 0
	}
	entries, err := os.ReadDir("/proc")
	if err != nil {
		return 0
	}
	want := "socket:[" + inode + "]"
	for _, e := range entries {
		pid, err := strconv.Atoi(e.Name())
		if err != nil {
			continue
		}
		fdDir := fmt.Sprintf("/proc/%d/fd", pid)
		fds, err := os.ReadDir(fdDir)
		if err != nil {
			continue
		}
		for _, fd := range fds {
			link, err := os.Readlink(fmt.Sprintf("%s/%s", fdDir, fd.Name()))
			if err != nil {
				continue
			}
			if link == want {
				return pid
			}
		}
	}
	return 0
}

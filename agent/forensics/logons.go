//go:build !windows

package forensics

import (
	"encoding/binary"
	"os"
	"strings"
	"time"
)

// glibc struct utmp layout on Linux x86_64 (384 bytes).
const (
	utmpSize        = 384
	utmpOffType     = 0
	utmpOffPID      = 4
	utmpOffLine     = 8
	utmpOffUser     = 44
	utmpOffHost     = 76
	utmpOffTVSec    = 356
	userProcessType = 7 // USER_PROCESS
)

// CollectLogons parses /var/run/utmp for current login sessions.
func CollectLogons() []LogonSession {
	data, err := os.ReadFile("/var/run/utmp")
	if err != nil {
		if data, err = os.ReadFile("/run/utmp"); err != nil {
			return nil
		}
	}

	var out []LogonSession
	for off := 0; off+utmpSize <= len(data); off += utmpSize {
		rec := data[off : off+utmpSize]
		typ := int16(binary.LittleEndian.Uint16(rec[utmpOffType:]))
		if typ != userProcessType {
			continue
		}
		pid := int(binary.LittleEndian.Uint32(rec[utmpOffPID:]))
		user := cstr(rec[utmpOffUser : utmpOffUser+32])
		line := cstr(rec[utmpOffLine : utmpOffLine+32])
		host := cstr(rec[utmpOffHost : utmpOffHost+256])
		sec := int64(binary.LittleEndian.Uint32(rec[utmpOffTVSec:]))
		if user == "" {
			continue
		}
		logonTime := time.Unix(sec, 0).UTC()
		if sec == 0 {
			logonTime = time.Time{}
		}

		isPriv := user == "root" || user == "admin"
		logType := "local"
		if host != "" {
			logType = "remote"
		}
		out = append(out, LogonSession{
			SessionID:   line,
			Username:    user,
			LogonType:   logType,
			LogonTime:   logonTime,
			SourceIP:    host,
			IsPrivilege: isPriv,
		})
		_ = pid
	}
	return out
}

func cstr(b []byte) string {
	if i := strings.IndexByte(string(b), 0); i >= 0 {
		return string(b[:i])
	}
	return string(b)
}

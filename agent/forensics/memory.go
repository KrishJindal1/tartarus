//go:build !windows

package forensics

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

// DumpMemoryRegions inspects /proc/[pid]/maps for notable memory regions
// (executable anonymous mappings, RWX regions). pid 0 = scan all processes
// (capped).
func DumpMemoryRegions(pid int) []MemRegion {
	var pids []int

	if pid > 0 {
		pids = []int{pid}
	} else {
		entries, err := os.ReadDir("/proc")
		if err != nil {
			return nil
		}
		for _, e := range entries {
			p, err := strconv.Atoi(e.Name())
			if err != nil {
				continue
			}
			pids = append(pids, p)
			if len(pids) >= 256 { // cap full-system scan
				break
			}
		}
	}

	var out []MemRegion
	for _, p := range pids {
		regions := scanMaps(p)
		out = append(out, regions...)
	}
	return out
}

func scanMaps(pid int) []MemRegion {
	path := fmt.Sprintf("/proc/%d/maps", pid)
	fh, err := os.Open(path)
	if err != nil {
		return nil
	}
	defer fh.Close()

	var out []MemRegion
	scanner := bufio.NewScanner(fh)
	scanner.Buffer(make([]byte, 64*1024), 1024*1024)
	for scanner.Scan() {
		line := scanner.Text()
		fields := strings.Fields(line)
		if len(fields) < 5 {
			continue
		}
		perms := fields[1]
		notable := false
		if perms == "rwxp" || perms == "rwxs" || perms == "r-xp" {
			notable = true
		}
		// anonymous executable / deleted-file executable mappings are notable
		if len(fields) >= 6 {
			mapping := strings.Join(fields[5:], " ")
			if strings.Contains(mapping, "[") || strings.Contains(mapping, "(deleted)") {
				if strings.Contains(perms, "x") {
					notable = true
				}
			}
		}
		if !notable {
			continue
		}

		rangeParts := strings.Split(fields[0], "-")
		if len(rangeParts) != 2 {
			continue
		}
		start, err1 := strconv.ParseUint(rangeParts[0], 16, 64)
		end, err2 := strconv.ParseUint(rangeParts[1], 16, 64)
		if err1 != nil || err2 != nil {
			continue
		}
		mapping := ""
		if len(fields) >= 6 {
			mapping = strings.Join(fields[5:], " ")
		}
		out = append(out, MemRegion{
			PID:         pid,
			BaseAddress: "0x" + rangeParts[0],
			RegionSize:  int64(end - start),
			Permissions: perms,
			Mapping:     mapping,
		})
	}
	return out
}

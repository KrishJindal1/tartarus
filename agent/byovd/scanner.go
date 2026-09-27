//go:build !windows

package byovd

import (
	"bufio"
	"os"
	"strings"
)

// ScanLoadedDrivers inspects loaded kernel modules (/proc/modules) against
// the BYOVD intelligence list. Detection-only: the agent reports vulnerable
// drivers for takedown/remediation and never manipulates driver callbacks.
func ScanLoadedDrivers() []DriverFinding {
	var findings []DriverFinding

	fh, err := os.Open("/proc/modules")
	if err != nil {
		return nil
	}
	defer fh.Close()

	scanner := bufio.NewScanner(fh)
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) == 0 {
			continue
		}
		name := strings.TrimSuffix(fields[0], ".ko")
		name = strings.TrimSuffix(name, "_linux")

		if intel, ok := lookupDriverIntel(fields[0]); ok {
			findings = append(findings, DriverFinding{
				Name:     fields[0],
				CVE:      intel.CVE,
				Impact:   intel.Impact,
				Severity: intel.Severity,
				Notes:    intel.Notes,
			})
			continue
		}
		if intel, ok := lookupDriverIntel(name + ".sys"); ok {
			findings = append(findings, DriverFinding{
				Name:     fields[0],
				CVE:      intel.CVE,
				Impact:   intel.Impact,
				Severity: intel.Severity,
				Notes:    intel.Notes,
			})
		}
	}

	// Also flag any .sys-style driver files visible under /dev (rare on Linux
	// but seen with wine/ndiswrapper style loaders).
	for _, p := range []string{"/dev", "/lib/modules"} {
		if entries, err := os.ReadDir(p); err == nil {
			for _, e := range entries {
				if intel, ok := lookupDriverIntel(e.Name()); ok {
					findings = append(findings, DriverFinding{
						Name:     e.Name(),
						Path:     p + "/" + e.Name(),
						CVE:      intel.CVE,
						Impact:   intel.Impact,
						Severity: intel.Severity,
						Notes:    intel.Notes,
					})
				}
			}
		}
	}

	return findings
}

func lookupDriverIntel(name string) (struct {
	CVE      string
	Impact   string
	Severity string
	Notes    string
}, bool) {
	v, ok := knownVulnerableDrivers[strings.ToLower(name)]
	if !ok {
		return struct {
			CVE      string
			Impact   string
			Severity string
			Notes    string
		}{}, false
	}
	return struct {
		CVE      string
		Impact   string
		Severity string
		Notes    string
	}{v.CVE, v.Impact, v.Severity, v.Notes}, true
}

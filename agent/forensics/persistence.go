//go:build !windows

package forensics

import (
	"os"
	"path/filepath"
	"strings"
)

// AnalyzePersistence collects persistence mechanisms from common Linux
// locations: cron, systemd units, autostart entries, rc.local, and profile.d
// snippets.
func AnalyzePersistence() []PersistEntry {
	var out []PersistEntry

	// --- cron ---
	out = append(out, scanCronDir("/etc/cron.d", "cron.d")...)
	out = append(out, scanCronFile("/etc/crontab", "crontab")...)
	if home, err := os.UserHomeDir(); err == nil {
		out = append(out, scanCronDir(filepath.Join(home, ".config/systemd/user"), "systemd-user")...)
		out = append(out, scanCronFile(filepath.Join(home, ".local/bin/.profile"), "profile")...)
	}
	if data, err := os.ReadFile("/var/spool/cron"); err == nil {
		_ = data
	}
	if entries, err := os.ReadDir("/var/spool/cron/crontabs"); err == nil {
		for _, e := range entries {
			p := filepath.Join("/var/spool/cron/crontabs", e.Name())
			out = append(out, scanCronFile(p, "user-cron:"+e.Name())...)
		}
	}

	// --- systemd services (enabled) ---
	out = append(out, scanSystemdDir("/etc/systemd/system", false)...)
	out = append(out, scanSystemdDir("/etc/systemd/system/multi-user.target.wants", true)...)

	// --- desktop autostart ---
	if entries, err := os.ReadDir("/etc/xdg/autostart"); err == nil {
		for _, e := range entries {
			p := filepath.Join("/etc/xdg/autostart", e.Name())
			out = append(out, PersistEntry{
				Type:      "autostart",
				Name:      e.Name(),
				Path:      p,
				IsEnabled: true,
			})
		}
	}
	if home, err := os.UserHomeDir(); err == nil {
		dir := filepath.Join(home, ".config/autostart")
		if entries, err := os.ReadDir(dir); err == nil {
			for _, e := range entries {
				p := filepath.Join(dir, e.Name())
				cmd := readFileField(p, "Exec=")
				out = append(out, PersistEntry{
					Type:      "autostart",
					Name:      e.Name(),
					Path:      p,
					Command:   cmd,
					IsEnabled: true,
				})
			}
		}
	}

	// --- rc.local ---
	if _, err := os.Stat("/etc/rc.local"); err == nil {
		body, _ := os.ReadFile("/etc/rc.local")
		enabled := strings.Contains(string(body), "exit 0")
		out = append(out, PersistEntry{
			Type:      "rc.local",
			Name:      "rc.local",
			Path:      "/etc/rc.local",
			Command:   strings.TrimSpace(string(body)),
			IsEnabled: enabled,
		})
	}

	// --- profile.d ---
	if entries, err := os.ReadDir("/etc/profile.d"); err == nil {
		for _, e := range entries {
			p := filepath.Join("/etc/profile.d", e.Name())
			body, err := os.ReadFile(p)
			if err != nil || len(body) == 0 {
				continue
			}
			suspicious := isSuspiciousSnippet(string(body))
			entry := PersistEntry{
				Type:      "profile.d",
				Name:      e.Name(),
				Path:      p,
				Command:   strings.TrimSpace(string(body)),
				IsEnabled: true,
			}
			if suspicious {
				entry.RiskFinding = "suspicious command in profile script"
			}
			out = append(out, entry)
		}
	}

	return out
}

func scanCronDir(dir, typ string) []PersistEntry {
	var out []PersistEntry
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil
	}
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		p := filepath.Join(dir, e.Name())
		body, err := os.ReadFile(p)
		if err != nil {
			continue
		}
		entry := PersistEntry{
			Type:      typ,
			Name:      e.Name(),
			Path:      p,
			Command:   strings.TrimSpace(string(body)),
			IsEnabled: true,
		}
		if isSuspiciousSnippet(string(body)) {
			entry.RiskFinding = "suspicious command scheduled"
		}
		out = append(out, entry)
	}
	return out
}

func scanCronFile(path, typ string) []PersistEntry {
	body, err := os.ReadFile(path)
	if err != nil {
		return nil
	}
	entry := PersistEntry{
		Type:      typ,
		Name:      filepath.Base(path),
		Path:      path,
		Command:   strings.TrimSpace(string(body)),
		IsEnabled: true,
	}
	if isSuspiciousSnippet(string(body)) {
		entry.RiskFinding = "suspicious command scheduled"
	}
	return []PersistEntry{entry}
}

func scanSystemdDir(dir string, forceEnabled bool) []PersistEntry {
	var out []PersistEntry
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil
	}
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".service") {
			continue
		}
		p := filepath.Join(dir, e.Name())
		body, err := os.ReadFile(p)
		if err != nil {
			continue
		}
		enabled := forceEnabled || symlinksIn(dir, e.Name())
		entry := PersistEntry{
			Type:      "systemd",
			Name:      e.Name(),
			Path:      p,
			Command:   extractExecLine(string(body)),
			IsEnabled: enabled || strings.Contains(string(body), "WantedBy="),
		}
		if isSuspiciousSnippet(string(body)) {
			entry.RiskFinding = "suspicious ExecStart"
		}
		out = append(out, entry)
	}
	return out
}

func symlinksIn(dir, name string) bool {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return false
	}
	for _, e := range entries {
		if e.Name() == name {
			return true
		}
	}
	return false
}

func extractExecLine(body string) string {
	for _, line := range strings.Split(body, "\n") {
		if strings.HasPrefix(strings.TrimSpace(line), "ExecStart=") {
			return strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(line), "ExecStart="))
		}
	}
	return ""
}

func readFileField(path, prefix string) string {
	body, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	for _, line := range strings.Split(string(body), "\n") {
		if strings.HasPrefix(line, prefix) {
			return strings.TrimPrefix(line, prefix)
		}
	}
	return ""
}

func isSuspiciousSnippet(body string) bool {
	needles := []string{
		"curl ", "wget ", "base64 -d", "nc -e", "bash -i",
		"/dev/tcp/", "chmod +x", "python -c", "perl -e",
		".onion", "reverse", "bash --version >/dev/null",
	}
	lower := strings.ToLower(body)
	for _, n := range needles {
		if strings.Contains(lower, n) {
			return true
		}
	}
	return false
}

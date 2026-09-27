package byovd

// DriverFinding represents a loaded kernel driver matched against known
// BYOVD (Bring Your Own Vulnerable Driver) intelligence.
type DriverFinding struct {
	Name     string `json:"name"`
	Path     string `json:"path,omitempty"`
	Version  string `json:"version,omitempty"`
	SHA256   string `json:"sha256,omitempty"`
	CVE      string `json:"cve,omitempty"`
	Impact   string `json:"impact"`
	Severity string `json:"severity"`
	Notes    string `json:"notes,omitempty"`
}

// knownVulnerableDrivers maps driver filenames to CVE/impact intel for
// detection-only BYOVD screening.
var knownVulnerableDrivers = map[string]struct {
	CVE      string
	Impact   string
	Severity string
	Notes    string
}{
	"dbutil_2_3.sys":     {"CVE-2021-21551", "kernel R/W via unsigned IOCTL", "critical", "Dell DBUtil driver"},
	"drv64.sys":          {"CVE-2020-8818", "kernel R/W privilege escalation", "high", "PCNS driver"},
	"gdrv.sys":           {"CVE-2009-0384", "BSOD / kernel memory corruption", "medium", "GIGABYTE driver (old)"},
	"iatik64.sys":        {"CVE-2021-3337", "kernel R/W", "high", "Intel driver"},
	"winio64.sys":        {"CVE-2021-25311", "kernel R/W", "high", "WinIO driver"},
	"procexp.sys":        {"N/A", "legitimate but abused by loaders", "low", "Sysinternals signed driver"},
	"winring0.sys":       {"CVE-2020-8818", "arbitrary physical memory R/W", "high", "Ring0 utility driver"},
	"capcom.sys":         {"CVE-2016-0812", "arbitrary kernel execution", "critical", "Capcom driver abused in the wild"},
	"aswarpot.sys":       {"CVE-2017-7326", "kernel R/W", "high", "Avast driver"},
	"hrwfwdrv_x64.sys":   {"CVE-2023-3731", "kernel R/W", "high", "Hacker Defender driver"},
	"rtcore64.sys":       {"CVE-2022-29304", "kernel R/W", "critical", "MSI Afterburner"},
	"physmemdrv.sys":     {"N/A", "physical memory access", "high", "raw physical memory driver"},
	"zam64.sys":          {"CVE-2022-37888", "BSOD / privilege escalation", "medium", "Zemana anti-cheat"},
	"eeyedrv.sys":        {"CVE-2024-36104", "kernel R/W", "high", "Eyeight driver"},
	"nsi.dll.nss":        {"CVE-2019-19117", "kernel R/W", "high", "Nahimic driver variant"},
	"rwdrv.sys":          {"CVE-2022-20070", "kernel R/W", "critical", "MSI RTCore"},
	"kprocesshacker.sys": {"N/A", "direct process memory access", "high", "KProcessHacker"},
}

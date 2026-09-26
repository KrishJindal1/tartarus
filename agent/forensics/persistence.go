package forensics

// PersistEntry represents a detected persistence mechanism (cron, systemd, run key, service).
type PersistEntry struct {
	Type        string `json:"type"`
	Name        string `json:"name"`
	Path        string `json:"path"`
	Command     string `json:"command"`
	IsEnabled   bool   `json:"is_enabled"`
	RiskFinding string `json:"risk_finding,omitempty"`
}

// AnalyzePersistence audits common persistence vectors across OS configurations.
func AnalyzePersistence() []PersistEntry {
	// Implementation placeholder
	return nil
}

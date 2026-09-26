package forensics

import "time"

// FileArtifact represents metadata and integrity hashes for analyzed endpoint files.
type FileArtifact struct {
	Path         string    `json:"path"`
	SizeBytes    int64     `json:"size_bytes"`
	SHA256       string    `json:"sha256"`
	ModifiedTime time.Time `json:"modified_time"`
	Permissions  string    `json:"permissions"`
	IsSuspicious bool      `json:"is_suspicious"`
}

// CollectFiles inspects directory paths, recent modifications, and suspicious file extensions.
func CollectFiles(targetDir string) []FileArtifact {
	// Implementation placeholder
	return nil
}

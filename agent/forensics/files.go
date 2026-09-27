package forensics

import (
	"crypto/sha256"
	"encoding/hex"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const (
	maxFileDepth = 4
	maxFiles     = 200
	maxHashBytes = 32 * 1024 * 1024 // hash files up to 32MB
)

var suspiciousExts = []string{
	".exe", ".scr", ".vbs", ".js", ".jar", ".ps1", ".bat", ".cmd", ".lnk",
	".dll", ".so", ".elf", ".deb", ".rpm", ".sh",
}

var doubleExtPatterns = []string{
	".pdf.exe", ".doc.exe", ".docx.exe", ".jpg.exe", ".png.exe", ".txt.exe",
	".xlsx.exe", ".zip.exe", ".mp4.exe", ".csv.exe",
}

// CollectFiles walks dir collecting metadata + SHA-256 for notable files.
func CollectFiles(dir string) []FileArtifact {
	if dir == "" {
		dir = "/"
	}
	var out []FileArtifact
	_ = filepath.WalkDir(dir, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return nil // skip unreadable entries
		}
		if d.IsDir() {
			depth := strings.Count(path, string(os.PathSeparator))
			if depth >= maxFileDepth && path != dir {
				return filepath.SkipDir
			}
			return nil
		}
		if len(out) >= maxFiles {
			return filepath.SkipAll
		}

		fi, err := d.Info()
		if err != nil {
			return nil
		}

		// only notable files: suspicious extension, double extension, or SUID-ish
		name := strings.ToLower(d.Name())
		notable := false
		for _, p := range doubleExtPatterns {
			if strings.HasSuffix(name, p) {
				notable = true
				break
			}
		}
		for _, ext := range suspiciousExts {
			if strings.HasSuffix(name, ext) {
				notable = true
				break
			}
		}
		if !notable && fi.Mode()&0o4000 != 0 { // SUID
			notable = true
		}
		if !notable {
			return nil
		}

		art := FileArtifact{
			Path:         path,
			SizeBytes:    fi.Size(),
			ModifiedTime: fi.ModTime().UTC().Truncate(time.Second),
			Permissions:  fi.Mode().String(),
		}

		// double-extension heuristic
		for _, p := range doubleExtPatterns {
			if strings.HasSuffix(name, p) {
				art.IsSuspicious = true
				break
			}
		}
		if fi.Mode()&0o4000 != 0 {
			art.IsSuspicious = true
		}
		if strings.HasPrefix(dir, "/tmp") || strings.HasPrefix(dir, "/dev/shm") {
			art.IsSuspicious = true
		}

		if fi.Size() <= maxHashBytes && fi.Mode().IsRegular() {
			art.SHA256 = hashFile(path)
		}

		out = append(out, art)
		return nil
	})
	return out
}

func hashFile(path string) string {
	f, err := os.Open(path)
	if err != nil {
		return ""
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return ""
	}
	return hex.EncodeToString(h.Sum(nil))
}

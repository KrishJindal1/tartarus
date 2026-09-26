package crypto

import (
	"crypto/sha256"
	"encoding/hex"
)

// SHA256Hex computes the SHA-256 hex digest of data.
func SHA256Hex(data []byte) string {
	h := sha256.Sum256(data)
	return hex.EncodeToString(h[:])
}

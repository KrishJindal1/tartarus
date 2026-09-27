package transport

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
)

// UploadResult uploads encrypted forensic result data to the designated
// storage destination (presigned PUT URL) using a hardened TLS client.
func UploadResult(destinationURL string, encryptedResult []byte) error {
	if destinationURL == "" {
		return fmt.Errorf("empty destination URL")
	}
	req, err := http.NewRequest(http.MethodPut, destinationURL, bytes.NewReader(encryptedResult))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/octet-stream")
	resp, err := NewTLSClient().Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("upload failed: HTTP %d: %s", resp.StatusCode, string(b))
	}
	return nil
}

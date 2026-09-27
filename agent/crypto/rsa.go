package crypto

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"fmt"
	"os"
)

// LoadRSAPrivateKey loads an RSA private key from a PEM-encoded file.
// PKCS#1 ("RSA PRIVATE KEY") and PKCS#8 ("PRIVATE KEY") are supported.
// Returns *rsa.PrivateKey.
func LoadRSAPrivateKey(path string) (interface{}, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return ParseRSAPrivateKey(data)
}

// ParseRSAPrivateKey parses PEM bytes into an RSA private key.
func ParseRSAPrivateKey(pemBytes []byte) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode(pemBytes)
	if block == nil {
		return nil, errors.New("no PEM block found")
	}
	if key, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return key, nil
	}
	parsed, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("unsupported private key: %w", err)
	}
	key, ok := parsed.(*rsa.PrivateKey)
	if !ok {
		return nil, errors.New("not an RSA private key")
	}
	return key, nil
}

// RSAUnwrapKey unwraps an AES key using RSA-OAEP with SHA-256. The wrapped
// key is standard base64 (matching the backend's Python base64.b64encode).
func RSAUnwrapKey(privKey interface{}, wrappedKeyB64 string) ([]byte, error) {
	key, ok := privKey.(*rsa.PrivateKey)
	if !ok {
		// allow (interface{}, nil) callers that passed LoadRSAPrivateKey result
		if k2, ok2 := privKey.(*rsa.PrivateKey); ok2 {
			key = k2
		} else {
			return nil, errors.New("unwrap requires an RSA private key")
		}
	}
	if key == nil {
		return nil, errors.New("nil RSA private key")
	}
	raw, err := base64.StdEncoding.DecodeString(wrappedKeyB64)
	if err != nil {
		return nil, fmt.Errorf("wrapped key not base64: %w", err)
	}
	return rsa.DecryptOAEP(sha256.New(), rand.Reader, key, raw, nil)
}

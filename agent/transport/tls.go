package transport

import (
	"crypto/tls"
	"net/http"
)

// NewTLSClient creates a hardened HTTP client with modern TLS configuration.
func NewTLSClient() *http.Client {
	tlsConfig := &tls.Config{
		MinVersion: tls.VersionTLS12,
	}
	transport := &http.Transport{
		TLSClientConfig: tlsConfig,
	}
	return &http.Client{Transport: transport}
}

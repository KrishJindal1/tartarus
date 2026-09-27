package crypto

import (
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
)

// PublicKeyPEM renders the public half of an RSA private key as PEM
// (SubjectPublicKeyInfo / PKIX) for registration with the backend.
func PublicKeyPEM(priv interface{}) string {
	key, ok := priv.(*rsa.PrivateKey)
	if !ok || key == nil {
		return ""
	}
	der, err := x509.MarshalPKIXPublicKey(&key.PublicKey)
	if err != nil {
		return ""
	}
	return string(pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: der}))
}

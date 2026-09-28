package crypto

import (
	"bytes"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"testing"
)

func TestAESRoundTrip(t *testing.T) {
	key, err := GenerateAESKey()
	if err != nil {
		t.Fatal(err)
	}
	pt := []byte("jocky forensic payload")
	ct, err := AESEncrypt(key, pt)
	if err != nil {
		t.Fatal(err)
	}
	if bytes.Equal(ct, pt) {
		t.Fatal("ciphertext equals plaintext")
	}
	got, err := AESDecrypt(key, ct)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(got, pt) {
		t.Fatalf("roundtrip mismatch: %q", got)
	}
}

func TestAESRejectsBadKey(t *testing.T) {
	if _, err := AESEncrypt([]byte("short"), []byte("x")); err == nil {
		t.Fatal("expected error for short key")
	}
}

func TestRSAUnwrapKey(t *testing.T) {
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	aesKey, _ := GenerateAESKey()
	ct, err := rsa.EncryptOAEP(
		// mirror backend: OAEP with SHA-256
		sha256.New(), rand.Reader, &priv.PublicKey, aesKey, nil,
	)
	if err != nil {
		t.Fatal(err)
	}
	wrapped := base64.StdEncoding.EncodeToString(ct)

	got, err := RSAUnwrapKey(priv, wrapped)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(got, aesKey) {
		t.Fatal("unwrapped key mismatch")
	}
}

func TestParseRSAPrivateKeyPEM(t *testing.T) {
	priv, _ := rsa.GenerateKey(rand.Reader, 2048)
	der := x509.MarshalPKCS1PrivateKey(priv)
	pemBytes := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: der})
	key, err := ParseRSAPrivateKey(pemBytes)
	if err != nil {
		t.Fatal(err)
	}
	if key.N.Cmp(priv.N) != 0 {
		t.Fatal("key mismatch after parse")
	}

	// public PEM rendering round-trip
	pubPEM := PublicKeyPEM(key)
	if pubPEM == "" {
		t.Fatal("expected public PEM")
	}
	block, _ := pem.Decode([]byte(pubPEM))
	if block == nil {
		t.Fatal("public PEM not decodable")
	}
	parsed, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		t.Fatal(err)
	}
	if _, ok := parsed.(*rsa.PublicKey); !ok {
		t.Fatal("expected RSA public key")
	}
}

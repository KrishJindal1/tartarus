"""
Cryptographic operations: AES-256-GCM symmetric encryption and RSA-OAEP asymmetric key wrap.
Used to secure evidence at rest and encrypt payloads during transit.
"""


def generate_aes_key() -> bytes:
    """Generate 256-bit symmetric AES key."""
    raise NotImplementedError("Crypto operations not implemented yet")


def aes_encrypt(key: bytes, plaintext: bytes) -> tuple[bytes, bytes]:
    """Encrypt payload using AES-256-GCM. Returns (nonce, ciphertext)."""
    raise NotImplementedError("Crypto operations not implemented yet")


def aes_decrypt(key: bytes, nonce: bytes, ciphertext: bytes) -> bytes:
    """Decrypt payload using AES-256-GCM."""
    raise NotImplementedError("Crypto operations not implemented yet")


def rsa_wrap_key(public_key_pem: str, aes_key: bytes) -> str:
    """Wrap AES key with RSA public key using OAEP padding."""
    raise NotImplementedError("Crypto operations not implemented yet")


def rsa_unwrap_key(private_key_pem: str, wrapped_key_b64: str) -> bytes:
    """Unwrap AES key with RSA private key."""
    raise NotImplementedError("Crypto operations not implemented yet")

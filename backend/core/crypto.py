"""
Cryptographic operations: AES-256-GCM symmetric encryption and RSA-OAEP
asymmetric key wrap. Used to secure evidence at rest and encrypt payloads
during transit between backend and agents.
"""

import base64
import os

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def generate_aes_key() -> bytes:
    """Generate a 256-bit symmetric AES key."""
    return os.urandom(32)


def aes_encrypt(key: bytes, plaintext: bytes, associated_data: bytes = b"") -> tuple:
    """Encrypt payload using AES-256-GCM. Returns (nonce, ciphertext)."""
    nonce = os.urandom(12)
    aesgcm = AESGCM(key)
    ct = aesgcm.encrypt(nonce, plaintext, associated_data)
    return nonce, ct


def aes_decrypt(key: bytes, nonce: bytes, ciphertext: bytes, associated_data: bytes = b"") -> bytes:
    """Decrypt payload using AES-256-GCM."""
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ciphertext, associated_data)


def rsa_wrap_key(public_key_pem: str, aes_key: bytes) -> str:
    """Wrap an AES key with the agent's RSA public key (OAEP). Returns base64."""
    pub = serialization.load_pem_public_key(public_key_pem.encode())
    ct = pub.encrypt(
        aes_key,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )
    return base64.b64encode(ct).decode()


def rsa_unwrap_key(private_key_pem: str, wrapped_key_b64: str) -> bytes:
    """Unwrap an AES key with an RSA private key (used in tests / recovery)."""
    priv = serialization.load_pem_private_key(private_key_pem.encode(), password=None)
    ct = base64.b64decode(wrapped_key_b64)
    return priv.decrypt(
        ct,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )


def generate_rsa_keypair() -> tuple:
    """Generate a 2048-bit RSA keypair. Returns (private_pem, public_pem)."""
    key = serialization.generate_private_key(public_exponent=65537, key_size=2048)
    priv = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    pub = key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return priv.decode(), pub.decode()

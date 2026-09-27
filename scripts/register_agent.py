"""
CLI utility to register a new endpoint agent:
Generates an RSA-2048 keypair, saves agent_private.pem, and registers the
agent with the JOCKEY backend (POST /agents/register).

Usage:
    python scripts/register_agent.py --hostname NTRO-TEST-01 --os linux
    python scripts/register_agent.py --hostname WIN-01 --os windows --backend http://127.0.0.1:8000
"""
import argparse
import json
import urllib.request
import uuid

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa


def parse_args():
    parser = argparse.ArgumentParser(description="Register a new Tartarus endpoint agent")
    parser.add_argument("--hostname", required=True, help="Target machine hostname")
    parser.add_argument("--os", choices=["windows", "linux"], default="linux", help="Target operating system")
    parser.add_argument("--key-output", default="agent_private.pem", help="Path to save generated private key")
    parser.add_argument("--backend", default="http://127.0.0.1:8000", help="JOCKEY backend base URL")
    parser.add_argument("--agent-id", default=None, help="Optional explicit agent id (generated if omitted)")
    return parser.parse_args()


def generate_keypair(key_path: str) -> str:
    """Generate RSA-2048 key; write PKCS#1 PEM private key, return public PEM."""
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    priv_pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),
    )
    with open(key_path, "wb") as fh:
        fh.write(priv_pem)

    pub_pem = key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return pub_pem.decode()


def register_agent(backend: str, hostname: str, os_name: str, agent_id: str, public_key_pem: str) -> dict:
    payload = json.dumps(
        {
            "agent_id": agent_id,
            "hostname": hostname,
            "os": os_name,
            "architecture": "amd64",
            "public_key": public_key_pem,
            "agent_version": "1.0.0",
        }
    ).encode()
    req = urllib.request.Request(
        f"{backend.rstrip('/')}/agents/register",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())


def main():
    args = parse_args()
    agent_id = args.agent_id or str(uuid.uuid4())
    print(f"Registering agent: id={agent_id} hostname={args.hostname} os={args.os}")

    public_key_pem = generate_keypair(args.key_output)
    print(f"Private key written to {args.key_output}")

    result = register_agent(args.backend, args.hostname, args.os, agent_id, public_key_pem)
    token = result.get("agent_token", "")
    print("Registered successfully.")
    print(f"  agent_id:   {result.get('agent', {}).get('agent_id', agent_id)}")
    print(f"  agent_token: {token[:24]}..." if token else "  agent_token: (not issued)")
    print("Start the agent with:")
    print(
        f"  ./tartarus-agent --agent-id {agent_id} "
        f"--c2 {args.backend} --privkey {args.key_output}"
    )


if __name__ == "__main__":
    main()

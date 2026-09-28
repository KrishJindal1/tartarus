"""
CLI utility to register a new endpoint agent:
Generates an RSA-2048 keypair, saves the private key, and registers the
agent with the Tartarus backend (POST /agents/register).

This is the manual/pre-provisioning path — the recommended path is the
installers (agent/install/install-linux.sh, install-windows.ps1), which
handle binary, key and registration themselves.

Usage:
    python3 scripts/register_agent.py --hostname NTRO-TEST-01                # auto-detect OS/arch/backend
    python3 scripts/register_agent.py --hostname WIN-01 --os windows
    python3 scripts/register_agent.py --hostname MAC-01 --os darwin --backend https://jockey-backend-ho8q.onrender.com
"""
import argparse
import json
import os as oslib
import platform
import urllib.request
import uuid

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa


def detect_os() -> str:
    system = platform.system().lower()
    if system == "darwin":
        return "darwin"
    if system.startswith("win"):
        return "windows"
    return "linux"


def detect_arch() -> str:
    machine = platform.machine().lower()
    if machine in ("x86_64", "amd64"):
        return "amd64"
    if machine in ("aarch64", "arm64"):
        return "arm64"
    return machine or "amd64"


def default_backend() -> str:
    return (
        oslib.environ.get("TARTARUS_BACKEND")
        or oslib.environ.get("BACKEND_URL")
        or "http://127.0.0.1:8000"
    )


def parse_args():
    parser = argparse.ArgumentParser(description="Register a new Tartarus endpoint agent")
    parser.add_argument("--hostname", required=True, help="Target machine hostname")
    parser.add_argument(
        "--os",
        choices=["auto", "windows", "linux", "darwin"],
        default="auto",
        help="Target operating system (default: auto-detect)",
    )
    parser.add_argument("--key-output", default="agent_private.pem", help="Path to save generated private key")
    parser.add_argument("--backend", default=default_backend(), help="Tartarus backend base URL (env: TARTARUS_BACKEND)")
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


def register_agent(backend: str, hostname: str, os_name: str, architecture: str,
                   agent_id: str, public_key_pem: str) -> dict:
    payload = json.dumps(
        {
            "agent_id": agent_id,
            "hostname": hostname,
            "os": os_name,
            "architecture": architecture,
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


def start_command(agent_id: str, backend: str, key_path: str) -> str:
    """Print the exact start command for this machine."""
    installed = oslib.path.expanduser("~/.jocky-agent/tartarus-agent")
    if oslib.path.isfile(installed):
        return f"{installed} --agent-id {agent_id} --c2 {backend} --privkey {key_path}"
    # build from the repo: `cd agent` then reference the key relative to it
    rel_key = key_path if oslib.path.isabs(key_path) else oslib.path.join("..", key_path)
    return (
        f"cd agent && go build -o tartarus-agent . && "
        f"./tartarus-agent --agent-id {agent_id} --c2 {backend} --privkey {rel_key}"
    )


def main():
    args = parse_args()
    os_name = detect_os() if args.os == "auto" else args.os
    arch = detect_arch()
    agent_id = args.agent_id or str(uuid.uuid4())
    print(f"Registering agent: id={agent_id} hostname={args.hostname} os={os_name} arch={arch}")
    print(f"Backend: {args.backend}")

    public_key_pem = generate_keypair(args.key_output)
    print(f"Private key written to {args.key_output}")

    result = register_agent(args.backend, args.hostname, os_name, arch, agent_id, public_key_pem)
    token = result.get("agent_token", "")
    print("Registered successfully.")
    print(f"  agent_id:    {result.get('agent', {}).get('agent_id', agent_id)}")
    print(f"  agent_token: {token[:24]}..." if token else "  agent_token: (not issued)")
    print("Start the agent with:")
    print(f"  {start_command(agent_id, args.backend.rstrip('/'), args.key_output)}")
    print("The agent self-registers its key on start and appears in the console within ~15s.")


if __name__ == "__main__":
    main()

"""
CLI utility to register a new endpoint agent:
Generates RSA keypair, exports agent_private.pem, and inserts registration record in Supabase.
"""
import argparse
import os
import sys


def parse_args():
    parser = argparse.ArgumentParser(description="Register a new Tartarus endpoint agent")
    parser.add_argument("--hostname", required=True, help="Target machine hostname")
    parser.add_argument("--os", choices=["windows", "linux"], default="linux", help="Target operating system")
    parser.add_argument("--key-output", default="agent_private.pem", help="Path to save generated private key")
    return parser.parse_args()


def main():
    args = parse_args()
    print(f"Registering agent: hostname={args.hostname}, os={args.os}")
    # Registration logic placeholder


if __name__ == "__main__":
    main()

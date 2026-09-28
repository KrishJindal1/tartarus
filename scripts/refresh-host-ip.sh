#!/usr/bin/env bash
# Run in the HOST distro (this WSL). Republishes the host's current eth0 IP
# so agents in other WSL distros always find the backend.
set -e
IP="$(ip -4 -o addr show scope global eth0 2>/dev/null | awk '{print $4}' | cut -d/ -f1 | head -1)"
IP="${IP:-$(hostname -I | awk '{print $1}')}"
[ -n "$IP" ] || { echo "could not detect host IP"; exit 1; }
echo "$IP" > /mnt/c/jocky-dist/host-ip.txt
echo "host-ip.txt -> $IP  (agents: http://$IP:8000)"

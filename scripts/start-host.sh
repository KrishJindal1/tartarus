#!/usr/bin/env bash
# Start (or restart) the JOCKY host stack in this WSL distro:
#   backend :8000 + dashboard :3000, and republish this distro's IP for agents
#   in the other WSL distros (C:\jocky-dist\host-ip.txt).
# Run this after any `wsl --shutdown` (IP may have changed).
set -e
REPO=/home/power/sih/jockey
mkdir -p /tmp/opencode

IP="$(ip -4 -o addr show scope global eth0 2>/dev/null | awk '{print $4}' | cut -d/ -f1 | head -1)"
IP="${IP:-$(hostname -I | awk '{print $1}')}"
echo "$IP" > /mnt/c/jocky-dist/host-ip.txt
echo "host ip -> $IP  (C:\\jocky-dist\\host-ip.txt)"

if ! pgrep -f "uvi[c]orn main:app" >/dev/null; then
  (cd "$REPO/backend" && setsid nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 >> /tmp/opencode/backend.log 2>&1 < /dev/null &)
  echo "backend : starting"
else
  echo "backend : already running"
fi

if ! pgrep -f "next-serve[r]" >/dev/null; then
  (cd "$REPO/frontend" && setsid nohup npm run dev >> /tmp/opencode/frontend.log 2>&1 < /dev/null &)
  echo "frontend: starting"
else
  echo "frontend: already running"
fi

sleep 3
echo -n "health  : "; curl -m3 -s http://127.0.0.1:8000/health || echo FAIL
echo "dashboard: http://localhost:3000  (open in Windows browser)"

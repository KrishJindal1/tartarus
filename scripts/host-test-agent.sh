#!/usr/bin/env bash
# Optional TEST agent living in the HOST distro using the WSL-AGENT-01 identity.
# Lets you test the pipeline before the new WSL distros are installed.
# WARNING: never run this while distro WSL-AGENT-01 uses the same identity.
REPO=/home/power/sih/jockey
ACTION="${1:-start}"
case "$ACTION" in
  start)
    if pgrep -f "[-]agent-id 714c36b8" >/dev/null; then
      echo "agent already running (pid $(pgrep -f '[-]agent-id 714c36b8' | tr '\n' ' '))"
      exit 0
    fi
    setsid nohup /mnt/c/jocky-dist/tartarus-linux-amd64 \
      --agent-id 714c36b8-d965-485a-8be7-967d4068fb03 \
      --c2 http://127.0.0.1:8000 \
      --privkey /mnt/c/jocky-dist/agent1.pem \
      >> /tmp/opencode/host-test-agent.log 2>&1 < /dev/null &
    sleep 2
    echo "started — stop with: bash $REPO/scripts/host-test-agent.sh stop"
    ;;
  stop)
    if PIDS="$(pgrep -f '[-]agent-id 714c36b8')" && [ -n "$PIDS" ]; then
      kill $PIDS 2>/dev/null
      echo "stopped (pids: $PIDS)"
    else
      echo "not running"
    fi
    python3 - <<'PY'
import sqlite3
c = sqlite3.connect("/home/power/sih/jockey/backend/jocky.db")
c.execute("UPDATE agents SET status='offline' WHERE id=?", ("714c36b8-d965-485a-8be7-967d4068fb03",))
c.commit()
print("DB status -> offline")
PY
    ;;
  *)
    echo "usage: bash $REPO/scripts/host-test-agent.sh start|stop"
    exit 1
    ;;
esac

#!/usr/bin/env bash
# JOCKY / Tartarus — Linux agent installer (amd64). Works on ANY Linux with
# internet access, regardless of network (agents reach the backend over its
# public URL). Safe to re-run; idempotent unless --force.
#
# Quick install (from any machine):
#   curl -fsSL https://raw.githubusercontent.com/himkarr/tartarus/main/agent/install/install-linux.sh \
#     | bash -s -- --c2 https://YOUR-BACKEND.onrender.com
#
# Options:
#   --c2 <url>        backend base URL (required), e.g. https://xxx.onrender.com
#   --agent-id <uuid> reuse a fixed agent id (default: generate once, persist)
#   --dir <path>      install dir (default: ~/.jocky-agent)
#   --source <url|path> binary source (default: GitHub raw releases/)
#   --systemd         install+enable a systemd service (run as root; boot autostart)
#   --no-start        install but don't start
#   --force           re-download binary & regenerate key
set -euo pipefail

C2=""
AGENT_ID=""
INSTALL_DIR="$HOME/.jocky-agent"
SOURCE="https://raw.githubusercontent.com/himkarr/tartarus/main/releases/tartarus-linux-amd64"
DO_SYSTEMD=0
START=1
FORCE=0

while [ $# -gt 0 ]; do
  case "$1" in
    --c2) C2="${2:-}"; shift 2 ;;
    --agent-id) AGENT_ID="${2:-}"; shift 2 ;;
    --dir) INSTALL_DIR="${2:-}"; shift 2 ;;
    --source) SOURCE="${2:-}"; shift 2 ;;
    --systemd) DO_SYSTEMD=1; shift ;;
    --no-start) START=0; shift ;;
    --force) FORCE=1; shift ;;
    *) echo "unknown arg: $1  (see header of this script for usage)"; exit 1 ;;
  esac
done

[ -n "$C2" ] || { echo "ERROR: --c2 <backend-url> is required, e.g. --c2 https://xxx.onrender.com"; exit 1; }
C2="${C2%/}"

ARCH="$(uname -m)"
case "$ARCH" in x86_64|amd64) ;; *)
  echo "ERROR: published binaries are amd64 only (this machine: $ARCH)."
  echo "Build from source: git clone https://github.com/himkarr/tartarus && cd tartarus/agent && go build -o tartarus-agent ."
  exit 1 ;;
esac

command -v curl >/dev/null || command -v wget >/dev/null || { echo "ERROR: curl or wget required"; exit 1; }

mkdir -p "$INSTALL_DIR"
BIN="$INSTALL_DIR/tartarus-agent"
KEY="$INSTALL_DIR/agent.pem"
IDFILE="$INSTALL_DIR/agent.id"
LOG="$INSTALL_DIR/agent.log"

fetch() { # $1=source $2=dest
  if [ -f "$1" ]; then cp "$1" "$2"
  elif command -v curl >/dev/null; then curl -fsSL --retry 3 -o "$2" "$1"
  else wget -qO "$2" "$1"; fi
}

if [ ! -x "$BIN" ] || [ "$FORCE" = "1" ]; then
  echo "==> downloading agent binary"
  fetch "$SOURCE" "$BIN.tmp"
  sz=$(wc -c < "$BIN.tmp")
  [ "$sz" -gt 1000000 ] || { echo "ERROR: download failed/too small ($sz bytes) from $SOURCE"; rm -f "$BIN.tmp"; exit 1; }
  chmod +x "$BIN.tmp" && mv "$BIN.tmp" "$BIN"
fi

if [ ! -f "$KEY" ] || [ "$FORCE" = "1" ]; then
  echo "==> generating RSA key"
  if command -v openssl >/dev/null; then
    openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$KEY" 2>/dev/null
  elif command -v ssh-keygen >/dev/null; then
    ssh-keygen -q -t rsa -b 2048 -m PEM -N "" -f "$KEY"; rm -f "$KEY.pub"
  else
    echo "ERROR: need openssl or ssh-keygen to create the agent key"; exit 1
  fi
fi

if [ -z "$AGENT_ID" ]; then
  if [ -f "$IDFILE" ]; then AGENT_ID="$(tr -d '[:space:]' < "$IDFILE")"; fi
fi
[ -n "$AGENT_ID" ] || AGENT_ID="$(cat /proc/sys/kernel/random/uuid 2>/dev/null || od -An -N16 -tx1 /dev/urandom | tr -d ' \n' | sed 's/^\(........\)\(....\)\(....\)\(....\)\(................\)$/\1-\2-\3-\4-\5/')"
echo "$AGENT_ID" > "$IDFILE"

echo "==> backend pre-check: $C2/health"
if command -v curl >/dev/null; then
  curl -m 8 -fsS "$C2/health" || { echo "ERROR: backend unreachable — deploy it first (see render.yaml / README deploy steps)"; exit 1; }
else
  wget -qT8 -O- "$C2/health" >/dev/null || { echo "ERROR: backend unreachable at $C2"; exit 1; }
fi

cat > "$INSTALL_DIR/start-agent.sh" <<START
#!/usr/bin/env bash
exec "$BIN" --agent-id "$AGENT_ID" --c2 "$C2" --privkey "$KEY"
START
chmod +x "$INSTALL_DIR/start-agent.sh"

if [ "$DO_SYSTEMD" = "1" ]; then
  [ "$(id -u)" = "0" ] || { echo "ERROR: --systemd requires root (sudo)"; exit 1; }
  command -v systemctl >/dev/null || { echo "ERROR: systemd not available"; exit 1; }
  cat > /etc/systemd/system/jocky-agent.service <<UNIT
[Unit]
Description=JOCKY endpoint agent
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=$INSTALL_DIR/start-agent.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT
  systemctl daemon-reload
  systemctl enable --now jocky-agent
  echo "==> systemd service enabled and started"
else
  if [ "$START" = "1" ]; then
    echo "==> starting agent"
    if command -v setsid >/dev/null; then
      setsid nohup "$INSTALL_DIR/start-agent.sh" > "$LOG" 2>&1 < /dev/null &
    else
      nohup "$INSTALL_DIR/start-agent.sh" > "$LOG" 2>&1 < /dev/null &
    fi
    sleep 3
  fi
fi

echo "==> verifying registration"
if command -v curl >/dev/null; then
  if curl -m 8 -fsS "$C2/agents/" | grep -q "$AGENT_ID"; then
    echo "SUCCESS: agent $AGENT_ID is ONLINE"
  else
    echo "WARN: not visible yet — check log: tail -20 $LOG"; exit 1
  fi
fi

cat <<EOF

Installed: $BIN
  id:     $AGENT_ID
  c2:     $C2
  start:  $INSTALL_DIR/start-agent.sh
  stop:   pkill -f '$(basename "$BIN").*$(echo "$AGENT_ID" | cut -c1-8)'
  log:    tail -f $LOG
  boot autostart: re-run this installer with: --systemd  (sudo)
EOF

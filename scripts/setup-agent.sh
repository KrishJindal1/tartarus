#!/usr/bin/env bash
# JOCKEY agent installer — run INSIDE one of the NEW WSL distros.
#   usage: bash /mnt/c/jockey-dist/setup-agent.sh <hostname> <reuse1|new>
#     reuse1 = claim the pre-registered WSL-AGENT-01 identity (id+key staged in C:\jockey-dist)
#     new    = generate a fresh identity (WSL-AGENT-02)
set -euo pipefail

DIST=/mnt/c/jockey-dist
NAME="${1:-}"
MODE="${2:-}"

if [ -z "$NAME" ] || [ -z "$MODE" ]; then
  echo "usage: bash $DIST/setup-agent.sh <hostname> <reuse1|new>"
  echo "  bash $DIST/setup-agent.sh WSL-AGENT-01 reuse1"
  echo "  bash $DIST/setup-agent.sh WSL-AGENT-02 new"
  exit 1
fi
case "$MODE" in reuse1|new) ;; *) echo "mode must be reuse1 or new"; exit 1;; esac

echo "==> prerequisites"
sudo apt-get update -qq
sudo apt-get install -y -qq openssl curl iproute2 ca-certificates >/dev/null

echo "==> hostname -> $NAME"
sudo hostnamectl set-hostname "$NAME" 2>/dev/null || { sudo bash -c "echo $NAME > /etc/hostname"; sudo hostname "$NAME"; }

echo "==> agent binary"
cp "$DIST/tartarus-linux-amd64" ~/tartarus-agent
chmod +x ~/tartarus-agent

if [ "$MODE" = "reuse1" ]; then
  AGENT_ID="714c36b8-d965-485a-8be7-967d4068fb03"
  cp "$DIST/agent1.pem" ~/agent.pem
  echo "==> reusing identity WSL-AGENT-01 ($AGENT_ID)"
  echo "    NOTE: stop any test agent on the host first:"
  echo "    (host distro) bash /home/power/sih/jockey/scripts/host-test-agent.sh stop"
else
  AGENT_ID="$(cat /proc/sys/kernel/random/uuid)"
  openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out ~/agent.pem 2>/dev/null
  echo "==> generated fresh identity ($AGENT_ID)"
fi
echo "$AGENT_ID" > ~/agent-id.txt

cat > ~/start-agent.sh <<'START'
#!/usr/bin/env bash
set -e
HOSTIP="$(tr -d '[:space:]' < /mnt/c/jockey-dist/host-ip.txt)"
[ -n "$HOSTIP" ] || { echo "host-ip.txt empty — run refresh-host-ip.sh in the HOST distro"; exit 1; }
echo "c2=http://${HOSTIP}:8000 agent-id=$(cat ~/agent-id.txt)"
exec ~/tartarus-agent --agent-id "$(cat ~/agent-id.txt)" \
  --c2 "http://${HOSTIP}:8000" --privkey ~/agent.pem
START
chmod +x ~/start-agent.sh

HOSTIP="$(tr -d '[:space:]' < "$DIST/host-ip.txt")"
echo "==> backend pre-check at http://$HOSTIP:8000/health"
if ! curl -m3 -fsS "http://$HOSTIP:8000/health"; then
  echo "!! backend unreachable — in HOST distro run: bash /home/power/sih/jockey/scripts/start-host.sh"
  exit 1
fi

echo "==> starting agent (log: /tmp/tartarus-agent.log)"
setsid nohup ~/start-agent.sh > /tmp/tartarus-agent.log 2>&1 < /dev/null &
sleep 3

echo "==> agents registered on backend:"
curl -m3 -fsS "http://$HOSTIP:8000/agents/" | head -c 1200; echo

cat <<EOF

DONE — agent '$NAME' is running.
  status:   tail -f /tmp/tartarus-agent.log
  stop:     kill \$(pgrep -f '[t]artarus-agent')
  start:    bash ~/start-agent.sh
  autostart (optional): echo 'bash ~/start-agent.sh >/tmp/tartarus-agent.log 2>&1 &' >> ~/.bashrc
EOF

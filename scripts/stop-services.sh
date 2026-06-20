#!/bin/sh
# Stop WiseWallet dev/production backend ports (macOS/Linux)

PORTS="3000 4001 4002 4003 4004 4005 4006 8080"

for p in $PORTS; do
  pids=$(lsof -ti :"$p" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "[stop-services] Killing port $p → $pids"
    kill -9 $pids 2>/dev/null || true
  fi
done

echo "[stop-services] Done. Ports cleared."

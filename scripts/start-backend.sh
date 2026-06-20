#!/bin/sh
# Starts backend microservices for Render bundled deploy.
# Free tier (512MB): set LITE_MODE=1 — skips worker + notification to avoid OOM.

set -e

# Cap heap per Node process (7 services × ~64MB fits ~512MB budget)
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=64}"

# Skip lsof port check on Render (fresh container)
if [ -z "$RENDER" ]; then
  PORTS="4001 4002 4003 4004 4005 4006 8080"
  for p in $PORTS; do
    if command -v lsof >/dev/null 2>&1 && lsof -ti :"$p" >/dev/null 2>&1; then
      echo "[start-backend] ERROR: Port $p is already in use."
      echo "[start-backend] Run: npm run stop:services"
      exit 1
    fi
  done
fi

start_svc() {
  pkg="$1"
  echo "[start-backend] Starting ${pkg}..."
  npm run start -w "$pkg" &
  sleep 2
}

echo "[start-backend] LITE_MODE=${LITE_MODE:-0} NODE_OPTIONS=${NODE_OPTIONS}"

# Core services (required)
start_svc @wisewallet/auth-service
start_svc @wisewallet/account-service
start_svc @wisewallet/transaction-service
start_svc @wisewallet/budget-service

if [ "$LITE_MODE" = "1" ]; then
  echo "[start-backend] LITE_MODE: skipping notification + worker (Render free 512MB)"
else
  start_svc @wisewallet/notification-service
  start_svc @wisewallet/worker-service
fi

echo "[start-backend] Waiting for services..."
sleep 4

echo "[start-backend] Starting API gateway on PORT=${PORT:-8080}..."
exec npm run start -w @wisewallet/api-gateway

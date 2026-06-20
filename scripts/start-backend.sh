#!/bin/sh
# Starts all backend microservices in one process tree (Render / bundled deploy).
# Internal services use fixed localhost ports; gateway binds to $PORT (Render requirement).

set -e

PORTS="4001 4002 4003 4004 4005 4006 8080"
for p in $PORTS; do
  if lsof -ti :"$p" >/dev/null 2>&1; then
    echo "[start-backend] ERROR: Port $p is already in use."
    echo "[start-backend] Stop npm run dev first, or run: npm run stop:services"
    exit 1
  fi
done

echo "[start-backend] Starting internal services..."

npm run start -w @wisewallet/auth-service &
npm run start -w @wisewallet/account-service &
npm run start -w @wisewallet/transaction-service &
npm run start -w @wisewallet/budget-service &
npm run start -w @wisewallet/notification-service &
npm run start -w @wisewallet/worker-service &

echo "[start-backend] Waiting for services to boot..."
sleep 5

echo "[start-backend] Starting API gateway on PORT=${PORT:-8080}..."
exec npm run start -w @wisewallet/api-gateway

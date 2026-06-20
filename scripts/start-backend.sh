#!/bin/sh
# Starts all backend microservices in one process tree (Render / bundled deploy).
# Internal services use fixed localhost ports; gateway binds to $PORT (Render requirement).

set -e

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

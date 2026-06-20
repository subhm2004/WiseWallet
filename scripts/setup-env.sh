#!/bin/sh
# Copy all .env.example files to .env

cp -n frontend/.env.example frontend/.env 2>/dev/null || cp frontend/.env.example frontend/.env
cp -n api-gateway/.env.example api-gateway/.env 2>/dev/null || cp api-gateway/.env.example api-gateway/.env
cp -n server/auth-service/.env.example server/auth-service/.env 2>/dev/null || cp server/auth-service/.env.example server/auth-service/.env
cp -n server/account-service/.env.example server/account-service/.env 2>/dev/null || cp server/account-service/.env.example server/account-service/.env
cp -n server/transaction-service/.env.example server/transaction-service/.env 2>/dev/null || cp server/transaction-service/.env.example server/transaction-service/.env
cp -n server/budget-service/.env.example server/budget-service/.env 2>/dev/null || cp server/budget-service/.env.example server/budget-service/.env
cp -n server/notification-service/.env.example server/notification-service/.env 2>/dev/null || cp server/notification-service/.env.example server/notification-service/.env
cp -n server/worker-service/.env.example server/worker-service/.env 2>/dev/null || cp server/worker-service/.env.example server/worker-service/.env
cp -n packages/database/.env.example packages/database/.env 2>/dev/null || cp packages/database/.env.example packages/database/.env

echo "Done! Edit each .env file with your credentials."

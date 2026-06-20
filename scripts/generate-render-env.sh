#!/bin/sh
# Builds .env.render from local service .env files for Render dashboard copy-paste.
# Usage: npm run render:env
# Output: .env.render (gitignored — never commit)

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/.env.render"

read_env() {
  file="$1"
  key="$2"
  if [ -f "$file" ]; then
    grep -E "^${key}=" "$file" 2>/dev/null | head -1 | cut -d= -f2- | sed 's/^"//;s/"$//'
  fi
}

DB=$(read_env "$ROOT/packages/database/.env" DATABASE_URL)
JWT=$(read_env "$ROOT/server/auth-service/.env" JWT_SECRET)
GOOGLE_ID=$(read_env "$ROOT/server/auth-service/.env" GOOGLE_CLIENT_ID)
GOOGLE_SECRET=$(read_env "$ROOT/server/auth-service/.env" GOOGLE_CLIENT_SECRET)
GROQ=$(read_env "$ROOT/server/transaction-service/.env" GROQ_API_KEY)
BREVO=$(read_env "$ROOT/server/notification-service/.env" BREVO_API_KEY)
EMAIL_FROM=$(read_env "$ROOT/server/notification-service/.env" EMAIL_FROM)
INTERNAL=$(read_env "$ROOT/server/notification-service/.env" INTERNAL_SERVICE_SECRET)
ARCJET=$(read_env "$ROOT/api-gateway/.env" ARCJET_KEY)

# Override: localhost until Render + Vercel URLs exist. After deploy run:
#   RENDER_API_URL=https://YOUR.onrender.com VERCEL_APP_URL=https://YOUR.vercel.app npm run render:env
RENDER_API_URL="${RENDER_API_URL:-http://localhost:8080}"
VERCEL_APP_URL="${VERCEL_APP_URL:-http://localhost:3000}"

cat > "$OUT" <<EOF
# WiseWallet — Render Web Service environment variables
# Copy ALL lines below into Render → wisewallet-api → Environment
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Regenerate: npm run render:env
# NEVER commit this file.

NODE_ENV=production

DATABASE_URL=${DB}
JWT_SECRET=${JWT}

WEB_URL=${VERCEL_APP_URL}
FRONTEND_URL=${VERCEL_APP_URL}
CORS_ORIGINS=${VERCEL_APP_URL}

GOOGLE_CLIENT_ID=${GOOGLE_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_SECRET}
GOOGLE_CALLBACK_URL=${RENDER_API_URL}/api/auth/google/callback

GROQ_API_KEY=${GROQ}

BREVO_API_KEY=${BREVO}
EMAIL_FROM=${EMAIL_FROM}
INTERNAL_SERVICE_SECRET=${INTERNAL}

ARCJET_KEY=${ARCJET}

# Bundled backend — keep localhost (services run in same container)
NOTIFICATION_SERVICE_URL=http://localhost:4005

# Render free tier — set 1 on 512MB plans
LITE_MODE=1

# Inngest Cloud — add after creating app at https://app.inngest.com
# Serve URL: ${RENDER_API_URL}/api/inngest
# INNGEST_EVENT_KEY=
# INNGEST_SIGNING_KEY=
EOF

echo "[render:env] Wrote $OUT"
echo "[render:env] WEB_URL=${VERCEL_APP_URL}"
echo "[render:env] GOOGLE_CALLBACK=${RENDER_API_URL}/api/auth/google/callback"
echo "[render:env] After deploy: RENDER_API_URL=https://xxx.onrender.com VERCEL_APP_URL=https://xxx.vercel.app npm run render:env"

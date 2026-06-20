#!/usr/bin/env sh
# Remove dev/build caches (Next.js, webpack, turbo, etc.)
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Cleaning WiseWallet caches..."

# Next.js build cache
rm -rf frontend/.next
rm -rf node_modules/@wisewallet/frontend/.next 2>/dev/null || true

# Any .next under workspace packages (including hoisted copies)
find . -path './node_modules/@wisewallet/*/.next' -type d -prune -exec rm -rf {} + 2>/dev/null || true

# Workspace .next folders (skip node_modules)
for dir in frontend api-gateway server packages; do
  if [ -d "$dir" ]; then
    find "$dir" -name '.next' -type d -not -path '*/node_modules/*' 2>/dev/null | while IFS= read -r path; do
      rm -rf "$path"
    done
  fi
done

# Bundler / tool caches
rm -rf node_modules/.cache
rm -rf frontend/node_modules/.cache 2>/dev/null || true

# Turborepo
rm -rf .turbo

# ESLint cache
rm -f frontend/.eslintcache

# TypeScript incremental build info
find frontend server packages api-gateway \
  -name '*.tsbuildinfo' \
  -not -path '*/node_modules/*' \
  -delete 2>/dev/null || true

echo "Done — caches cleared."

# WiseWallet — Setup & Run Guide

**The complete, step-by-step guide** to install, configure, run, test, and troubleshoot WiseWallet on your machine.

> For project overview, architecture, and API reference, see [`README.md`](./README.md).

---

## Table of Contents

1. [What You Need Before Starting](#what-you-need-before-starting)
2. [Prerequisites](#prerequisites)
3. [Setup Tiers — Minimum vs Full](#setup-tiers--minimum-vs-full)
4. [Project Structure](#project-structure)
5. [Architecture Overview](#architecture-overview)
6. [Quick Start (Already Configured)](#quick-start-already-configured)
7. [Full Setup From Scratch](#full-setup-from-scratch)
8. [Step-by-Step: Neon Database](#step-by-step-neon-database)
9. [Step-by-Step: JWT & Internal Secrets](#step-by-step-jwt--internal-secrets)
10. [Step-by-Step: Google OAuth](#step-by-step-google-oauth)
11. [Step-by-Step: Groq AI](#step-by-step-groq-ai)
12. [Step-by-Step: Brevo Email](#step-by-step-brevo-email)
13. [Step-by-Step: ArcJet Security](#step-by-step-arcjet-security)
14. [Environment Variables — Complete Reference](#environment-variables--complete-reference)
15. [Environment Checklist (All 9 Files)](#environment-checklist-all-9-files)
16. [Database Setup & Migrations](#database-setup--migrations)
17. [Running the Project](#running-the-project)
18. [URLs When Running](#urls-when-running)
19. [First-Time User Walkthrough](#first-time-user-walkthrough)
20. [Testing Every Feature](#testing-every-feature)
21. [Inngest Background Jobs](#inngest-background-jobs)
22. [Email Testing (CLI & UI)](#email-testing-cli--ui)
23. [Split Expenses Setup & Test](#split-expenses-setup--test)
24. [Available Scripts](#available-scripts)
25. [Auth Flow (How Login Works)](#auth-flow-how-login-works)
26. [Verification Checklist](#verification-checklist)
27. [Troubleshooting](#troubleshooting)
28. [Production Preparation](#production-preparation)

---

## What You Need Before Starting

WiseWallet is a **monorepo** with **9 running processes** in dev mode. Plan for:

| Requirement | Details |
|-------------|---------|
| **Time** | ~30–45 min first-time full setup |
| **Disk** | ~500 MB for `node_modules` |
| **RAM** | 4 GB+ recommended (9 Node processes) |
| **Ports** | 3000, 4001–4006, 8080, 8288 must be free |
| **Internet** | Required for Neon, Google OAuth, Groq, Brevo |

---

## Prerequisites

### Required Software

| Tool | Version | Check Command | Install |
|------|---------|---------------|---------|
| **Node.js** | 18+ (20 LTS recommended) | `node -v` | [nodejs.org](https://nodejs.org) |
| **npm** | 9+ | `npm -v` | Comes with Node |
| **Git** | Any recent | `git --version` | [git-scm.com](https://git-scm.com) |
| **OpenSSL** | Any | `openssl version` | Pre-installed on Mac/Linux |

### Optional but Useful

| Tool | Purpose |
|------|---------|
| **curl** | Test API health endpoints |
| **lsof** | Find processes blocking ports (Mac/Linux) |
| **VS Code / Cursor** | Recommended editor |

### Verify Prerequisites

```sh
node -v          # v20.x.x recommended
npm -v           # 9.x or 10.x
git --version
openssl version
```

---

## Setup Tiers — Minimum vs Full

Choose your setup level:

### Tier 1 — Minimum (App runs, basic features)

| Service | Required |
|---------|----------|
| Neon `DATABASE_URL` | ✅ |
| `JWT_SECRET` | ✅ |
| Google OAuth OR email/password | ✅ |
| `API_GATEWAY_URL` + `WEB_URL` | ✅ |

**Works:** Login, accounts, transactions, budgets, dashboard, splits  
**Missing:** Receipt AI scan, emails, rate limiting, AI coach

### Tier 2 — Recommended (Full local experience)

Everything in Tier 1 **plus:**

| Service | Required |
|---------|----------|
| `GROQ_API_KEY` | Receipt scan + AI coach + monthly insights |
| `BREVO_API_KEY` + verified `EMAIL_FROM` | All emails |
| `ARCJET_KEY` | Security + rate limits |
| `INTERNAL_SERVICE_SECRET` | Worker → notification emails |

### Tier 3 — Production

Tier 2 **plus** production URLs, Inngest cloud keys, verified domain, migrations deploy.

---

## Project Structure

```
WiseWallet/
├── frontend/                          # Next.js 15 UI                         (:3000)
│   ├── app/                           # App Router pages
│   ├── components/                    # UI components
│   ├── lib/api.js                     # API client (all endpoints)
│   ├── middleware.js                  # Route protection
│   └── .env                           # API_GATEWAY_URL
│
├── api-gateway/                       # Single API entry point               (:8080)
│   └── src/index.js                   # Proxy routes to all services
│
├── server/
│   ├── auth-service/                  # Google OAuth + JWT + sessions        (:4001)
│   ├── account-service/               # Bank accounts CRUD                   (:4002)
│   ├── transaction-service/           # Transactions, splits, AI, analytics  (:4003)
│   ├── budget-service/                # Budgets, category budgets, goals     (:4004)
│   ├── notification-service/          # Brevo emails                         (:4005)
│   └── worker-service/                # Inngest background jobs              (:4006)
│
├── packages/
│   ├── database/                      # Prisma schema + Neon client
│   │   └── prisma/schema.prisma
│   └── shared/                        # JWT, ArcJet, SERVICE_PORTS, currency
│
├── scripts/
│   ├── setup-env.sh                   # Copy all .env.example → .env
│   └── clean-cache.sh                 # Clear Next.js / webpack caches
│
├── package.json                       # Root monorepo scripts
├── README.md                          # Full project documentation
└── setup.md                           # This file
```

### npm Workspaces

All packages are linked via npm workspaces. Install once from root:

```sh
npm install   # Installs frontend + all services + packages
```

Run any service individually:

```sh
npm run dev -w @wisewallet/auth-service
npm run start -w @wisewallet/frontend
```

---

## Architecture Overview

```
Browser (localhost:3000)
        │
        │  All /api/* requests
        ▼
Next.js rewrites ──────────────────► api-gateway (:8080)
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              ▼              ▼             ▼              ▼             ▼
         auth-service   account-svc   transaction-svc  budget-svc   notification-svc
            :4001          :4002           :4003           :4004          :4005
              │              │               │               │              │
              └──────────────┴───────────────┴───────────────┴──────────────┘
                                           │
                                           ▼
                              Neon PostgreSQL (packages/database)
                                           ▲
                                           │
                              worker-service (:4006)
                                           ▲
                                           │
                              Inngest Dev Server (:8288)
```

### How Frontend Talks to Backend

1. Browser calls `/api/transactions` (same origin — no CORS issues)
2. `frontend/next.config.mjs` rewrites to `http://localhost:8080/api/transactions`
3. Gateway proxies to `http://localhost:4003/` (transaction-service)
4. Service verifies JWT → queries Neon → returns JSON

### Important Gateway Notes

- Gateway does **NOT** use `express.json()` — bodies stream directly to services
- This is required for **multipart receipt uploads** to work
- `/api/splits` is rewritten to `/splits` on transaction-service (not root `/`)

---

## Quick Start (Already Configured)

If all `.env` files are already filled in:

```sh
npm install
npm run db:generate
npm run db:push
npm run dev
```

Open **http://localhost:3000** → Sign in.

**Stale UI?** Run with cache clean:

```sh
npm run dev:clean
```

Then hard-refresh browser: `Cmd + Shift + R` (Mac) / `Ctrl + Shift + R` (Windows).

---

## Full Setup From Scratch

### Step 1 — Clone & Install

```sh
git clone <your-repo-url>
cd WiseWallet
npm install
```

Wait for all workspace packages to install (~2–5 minutes).

### Step 2 — Create Environment Files

```sh
npm run setup:env
```

This runs `scripts/setup-env.sh` and creates `.env` in **9 locations**:

| # | File Created |
|---|--------------|
| 1 | `frontend/.env` |
| 2 | `api-gateway/.env` |
| 3 | `server/auth-service/.env` |
| 4 | `server/account-service/.env` |
| 5 | `server/transaction-service/.env` |
| 6 | `server/budget-service/.env` |
| 7 | `server/notification-service/.env` |
| 8 | `server/worker-service/.env` |
| 9 | `packages/database/.env` |

> **Note:** There is **no root `.env`**. Each service loads its own file from its working directory via `@wisewallet/shared/src/env.js`.

### Step 3 — Configure External Services

Follow the step-by-step guides below in this order:

1. [Neon Database](#step-by-step-neon-database) — required
2. [JWT & Internal Secrets](#step-by-step-jwt--internal-secrets) — required
3. [Google OAuth](#step-by-step-google-oauth) — required for Google login
4. [Groq AI](#step-by-step-groq-ai) — optional
5. [Brevo Email](#step-by-step-brevo-email) — optional
6. [ArcJet Security](#step-by-step-arcjet-security) — optional

Use the [Environment Checklist](#environment-checklist-all-9-files) to verify all files.

### Step 4 — Database

```sh
npm run db:generate
npm run db:push
```

### Step 5 — Run

```sh
npm run dev
```

### Step 6 — Verify

```sh
curl http://localhost:8080/health
```

All services should show `"status": "ok"`.

---

## Step-by-Step: Neon Database

### 1. Create Neon Account

1. Go to [neon.tech](https://neon.tech) → Sign up (free)
2. Click **New Project**
3. Name: `wisewallet`
4. Region: choose closest to you (e.g. `AWS US East`)
5. PostgreSQL version: **16** (default)

### 2. Copy Connection String

1. Dashboard → **Connection Details**
2. Select **Connection string** tab
3. Copy the URL — looks like:

```
postgresql://neondb_owner:AbCdEf123@ep-cool-name-12345678.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 3. Paste in ALL 7 `.env` Files

The **exact same URL** must go in:

```
packages/database/.env
server/auth-service/.env
server/account-service/.env
server/transaction-service/.env
server/budget-service/.env
server/notification-service/.env
server/worker-service/.env
```

```env
DATABASE_URL=postgresql://neondb_owner:...@ep-xxx.neon.tech/neondb?sslmode=require
```

> ⚠️ URL **must** include `?sslmode=require` at the end.

### 4. Push Schema

```sh
npm run db:generate
npm run db:push
```

Expected output: `Your database is now in sync with your Prisma schema.`

### 5. Verify (Optional)

```sh
npm run db:studio
```

Opens Prisma Studio at **http://localhost:5555** — you should see empty tables.

---

## Step-by-Step: JWT & Internal Secrets

Generate two secrets once, then paste in multiple files:

```sh
# JWT secret (for auth tokens)
openssl rand -base64 32

# Internal service secret (worker → notification)
openssl rand -hex 24
```

Example output:
```
JWT_SECRET → xK7mP2nQ9rT4vW8yZ1aB3cD5eF6gH7iJ8kL9mN0oP1q=
INTERNAL   → a1b2c3d4e5f6789012345678abcdef012345
```

### Where to Paste

**`JWT_SECRET`** — same value in all 5:

```
server/auth-service/.env
server/account-service/.env
server/transaction-service/.env
server/budget-service/.env
server/notification-service/.env
```

**`INTERNAL_SERVICE_SECRET`** — same value in both:

```
server/auth-service/.env          # for password reset emails
server/notification-service/.env
server/worker-service/.env
```

> ⚠️ If `JWT_SECRET` differs between services → you get `401 Unauthorized` on API calls.

---

## Step-by-Step: Google OAuth

### 1. Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project: **WiseWallet** (or use existing)

### 2. OAuth Consent Screen

1. **APIs & Services → OAuth consent screen**
2. User Type: **External** → Create
3. Fill in:
   - App name: `WiseWallet`
   - User support email: your email
   - Developer contact: your email
4. Scopes: add `email`, `profile`, `openid` (defaults)
5. Test users: add your Gmail (required while app is in "Testing" mode)
6. Save

### 3. Create OAuth Client

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
2. Application type: **Web application**
3. Name: `WiseWallet Local`

**Authorized JavaScript origins:**

```
http://localhost:3000
http://localhost:8080
```

**Authorized redirect URIs:**

```
http://localhost:8080/api/auth/google/callback
```

4. Click **Create**
5. Copy **Client ID** and **Client Secret**

### 4. Paste in auth-service `.env`

```env
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxx
GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback
WEB_URL=http://localhost:3000
```

Also set in `api-gateway/.env`:

```env
WEB_URL=http://localhost:3000
```

And `frontend/.env`:

```env
API_GATEWAY_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Test Google Login

1. `npm run dev`
2. Open http://localhost:3000/sign-in
3. Click **Continue with Google**
4. Should redirect back to `/dashboard`

### Common Google OAuth Errors

| Error | Fix |
|-------|-----|
| `redirect_uri_mismatch` | URI must be exactly `http://localhost:8080/api/auth/google/callback` |
| `access_denied` | Add your Gmail as test user in OAuth consent screen |
| `invalid_client` | Check Client ID/Secret copied correctly |

---

## Step-by-Step: Groq AI

Used for: receipt scanning, AI finance coach, monthly report insights.

### 1. Get API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up → **API Keys → Create API Key**
3. Copy key (starts with `gsk_`)

### 2. Paste in Two Services

```env
# server/transaction-service/.env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx

# server/worker-service/.env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx
```

### 3. Test Receipt Scan

1. Create a bank account on dashboard
2. Go to **Add Transaction**
3. Upload a clear receipt photo
4. Amount, merchant, category should auto-fill

---

## Step-by-Step: Brevo Email

Used for: test emails, budget alerts, bill reminders, weekly digest, monthly reports.

### 1. Create Brevo Account

1. Go to [brevo.com](https://www.brevo.com) → Sign up (free — 300 emails/day)

### 2. Verify Sender

1. **Senders & Domains → Senders → Add a sender**
2. Enter email (e.g. `noreply@yourdomain.com` or your Gmail for testing)
3. Verify via confirmation email Brevo sends you

> ⚠️ Emails will **fail silently** if sender is not verified.

### 3. Get API Key

1. **Settings → SMTP & API → API Keys**
2. Create key → copy (starts with `xkeysib-`)

### 4. Paste in notification-service `.env`

```env
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxx
EMAIL_FROM=WiseWallet <noreply@yourdomain.com>
INTERNAL_SERVICE_SECRET=<same-as-worker-service>
JWT_SECRET=<same-as-auth-service>
DATABASE_URL=<same-neon-url>
```

Also ensure `worker-service/.env` has matching `INTERNAL_SERVICE_SECRET`.

### 5. Test Email

**From UI:**
1. Dashboard → scroll to **Email Notifications**
2. Click **Send Test Email**

**From CLI:**

```sh
npm run email:test
```

Check inbox + dashboard email history list.

---

## Step-by-Step: ArcJet Security

Used for: WAF shield, bot detection (gateway), rate limiting (accounts/transactions).

### 1. Get API Key

1. Go to [app.arcjet.com](https://app.arcjet.com)
2. Create account → **Add Site**
3. Copy key (starts with `ajkey_`)

### 2. Paste in Three Services

```env
# api-gateway/.env
ARCJET_KEY=ajkey_xxxxxxxx

# server/account-service/.env
ARCJET_KEY=ajkey_xxxxxxxx

# server/transaction-service/.env
ARCJET_KEY=ajkey_xxxxxxxx
ARCJET_ENV=development
```

### 3. Verify

Restart dev server. Console should show:

```
[api-gateway] ArcJet shield + bot detection enabled
```

### Rate Limits (when ArcJet enabled)

| Action | Limit |
|--------|-------|
| Create account | 10 / hour / user |
| Create transaction | 10 / hour / user |
| Receipt scan | 5 / hour / user |

---

## Environment Variables — Complete Reference

Each service loads its **own** `.env`. Optional vars marked with `(optional)`.

### `frontend/.env`

```env
# Required — gateway URL for Next.js /api rewrites
API_GATEWAY_URL=http://localhost:8080

# Optional — used in metadata and split invite URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### `api-gateway/.env`

```env
# Required — CORS allowed origin
WEB_URL=http://localhost:3000

# Optional — ArcJet shield + bot detection
ARCJET_KEY=ajkey_xxxxxxxx

# Optional
NODE_ENV=development
```

### `server/auth-service/.env`

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-super-secret-jwt-key-change-this

GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback
WEB_URL=http://localhost:3000

# Optional — for password reset emails
NOTIFICATION_SERVICE_URL=http://localhost:4005
INTERNAL_SERVICE_SECRET=your-internal-service-secret
```

### `server/account-service/.env`

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-super-secret-jwt-key-change-this    # SAME as auth-service
ARCJET_KEY=ajkey_xxxxxxxx                           # SAME as gateway (optional)
```

### `server/transaction-service/.env`

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-super-secret-jwt-key-change-this    # SAME as auth-service
GROQ_API_KEY=gsk_xxxxxxxx                         # Optional
ARCJET_KEY=ajkey_xxxxxxxx                         # Optional
ARCJET_ENV=development                            # Optional
```

### `server/budget-service/.env`

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-super-secret-jwt-key-change-this    # SAME as auth-service
```

### `server/notification-service/.env`

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-super-secret-jwt-key-change-this    # SAME as auth-service
BREVO_API_KEY=xkeysib-xxxxxxxx                    # Optional
EMAIL_FROM=WiseWallet <noreply@yourdomain.com>    # Optional
INTERNAL_SERVICE_SECRET=your-internal-service-secret  # SAME as worker
```

### `server/worker-service/.env`

```env
DATABASE_URL=postgresql://...
GROQ_API_KEY=gsk_xxxxxxxx                         # Optional
INTERNAL_SERVICE_SECRET=your-internal-service-secret  # SAME as notification
NOTIFICATION_SERVICE_URL=http://localhost:4005
FRONTEND_URL=http://localhost:3000

# Production only:
# INNGEST_EVENT_KEY=
# INNGEST_SIGNING_KEY=
```

### `packages/database/.env`

```env
DATABASE_URL=postgresql://...   # SAME Neon URL — used by Prisma CLI only
```

### Values That MUST Match

| Variable | Must Be Identical In |
|----------|---------------------|
| `DATABASE_URL` | auth, account, transaction, budget, notification, worker, packages/database |
| `JWT_SECRET` | auth, account, transaction, budget, notification |
| `ARCJET_KEY` | api-gateway, account-service, transaction-service |
| `INTERNAL_SERVICE_SECRET` | auth-service, notification-service, worker-service |

---

## Environment Checklist (All 9 Files)

Use this checklist after running `npm run setup:env`:

```
[ ] frontend/.env
    [ ] API_GATEWAY_URL=http://localhost:8080
    [ ] NEXT_PUBLIC_APP_URL=http://localhost:3000

[ ] api-gateway/.env
    [ ] WEB_URL=http://localhost:3000
    [ ] ARCJET_KEY (optional)

[ ] server/auth-service/.env
    [ ] DATABASE_URL
    [ ] JWT_SECRET
    [ ] GOOGLE_CLIENT_ID
    [ ] GOOGLE_CLIENT_SECRET
    [ ] GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback
    [ ] WEB_URL=http://localhost:3000
    [ ] INTERNAL_SERVICE_SECRET (for password reset)

[ ] server/account-service/.env
    [ ] DATABASE_URL (same)
    [ ] JWT_SECRET (same)
    [ ] ARCJET_KEY (optional, same)

[ ] server/transaction-service/.env
    [ ] DATABASE_URL (same)
    [ ] JWT_SECRET (same)
    [ ] GROQ_API_KEY (optional)
    [ ] ARCJET_KEY (optional, same)

[ ] server/budget-service/.env
    [ ] DATABASE_URL (same)
    [ ] JWT_SECRET (same)

[ ] server/notification-service/.env
    [ ] DATABASE_URL (same)
    [ ] JWT_SECRET (same)
    [ ] BREVO_API_KEY (optional)
    [ ] EMAIL_FROM (optional, verified in Brevo)
    [ ] INTERNAL_SERVICE_SECRET (same)

[ ] server/worker-service/.env
    [ ] DATABASE_URL (same)
    [ ] GROQ_API_KEY (optional)
    [ ] INTERNAL_SERVICE_SECRET (same)
    [ ] NOTIFICATION_SERVICE_URL=http://localhost:4005
    [ ] FRONTEND_URL=http://localhost:3000

[ ] packages/database/.env
    [ ] DATABASE_URL (same)
```

---

## Database Setup & Migrations

### Commands

| Command | When to Use |
|---------|-------------|
| `npm run db:generate` | After any `schema.prisma` change |
| `npm run db:push` | Dev — push schema directly to Neon |
| `npm run db:migrate` | Dev — create named migration file |
| `npm run db:migrate:deploy` | Production — apply pending migrations |
| `npm run db:studio` | Browse/edit data in GUI |
| `npm run db:seed` | Insert demo transactions (optional) |

### Recommended Dev Workflow

```sh
# After pulling new code with schema changes:
npm run db:generate
npm run db:push
```

### Production Workflow

```sh
npm run db:generate
npm run db:migrate:deploy
```

### All Database Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts, profile, dashboard widget prefs |
| `user_sessions` | Refresh token sessions |
| `accounts` | Bank accounts (Current/Savings) |
| `transactions` | Income & expense records |
| `budgets` | Monthly spending limit |
| `category_budgets` | Per-category limits |
| `savings_goals` | Savings targets |
| `category_rules` | Auto-categorization patterns |
| `email_logs` | Sent email history |
| `split_groups` | Expense split groups |
| `split_members` | Group members |
| `split_expenses` | Shared expenses |
| `split_shares` | Per-member share amounts |
| `split_settlements` | Recorded payments between members |
| `password_reset_tokens` | Password reset flow |

### Migration Files

Located in `packages/database/prisma/migrations/`:

```
20250620000000_google_oauth/
20250620120000_profile_splits_alerts/
20250620180000_auth_rules_invite/
20250620210000_split_settlements/
20250620220000_sessions_widgets_collab_splits/
```

---

## Running the Project

### Start Everything (Recommended)

```sh
npm run dev
```

Starts **9 processes** via `concurrently`:

| Process | Port | Log Prefix | Package |
|---------|------|------------|---------|
| frontend | 3000 | `[frontend]` | `@wisewallet/frontend` |
| api-gateway | 8080 | `[gateway]` | `@wisewallet/api-gateway` |
| auth-service | 4001 | `[auth]` | `@wisewallet/auth-service` |
| account-service | 4002 | `[account]` | `@wisewallet/account-service` |
| transaction-service | 4003 | `[txn]` | `@wisewallet/transaction-service` |
| budget-service | 4004 | `[budget]` | `@wisewallet/budget-service` |
| notification-service | 4005 | `[notify]` | `@wisewallet/notification-service` |
| worker-service | 4006 | `[worker]` | `@wisewallet/worker-service` |
| inngest dev | 8288 | `[inngest]` | inngest-cli |

Each backend service uses `node --watch` — auto-restarts on file changes.

### Start With Clean Cache

If UI shows old/stale content:

```sh
npm run dev:clean
```

This runs `scripts/clean-cache.sh` which removes:
- `frontend/.next`
- webpack / turbo / eslint caches
- TypeScript build info

Then hard-refresh browser: `Cmd + Shift + R`.

### Start Individual Services

Useful when debugging one service:

```sh
# Terminal 1 — gateway (required for API)
npm run dev:gateway

# Terminal 2 — auth
npm run dev -w @wisewallet/auth-service

# Terminal 3 — frontend
npm run dev:frontend

# Terminal 4 — inngest (for background jobs)
npm run dev:inngest
```

Minimum to test login: **gateway + auth-service + frontend**.

Minimum for transactions: **gateway + auth + account + transaction + frontend**.

### Production Build

```sh
npm run build

# Start each service in production mode:
npm run start -w @wisewallet/frontend          # :3000
npm run start -w @wisewallet/api-gateway         # :8080
npm run start -w @wisewallet/auth-service        # :4001
npm run start -w @wisewallet/account-service     # :4002
npm run start -w @wisewallet/transaction-service # :4003
npm run start -w @wisewallet/budget-service      # :4004
npm run start -w @wisewallet/notification-service# :4005
npm run start -w @wisewallet/worker-service      # :4006
```

### Change Ports

Edit `packages/shared/src/index.js`:

```js
export const SERVICE_PORTS = {
  GATEWAY: 8080,
  AUTH: 4001,
  ACCOUNT: 4002,
  TRANSACTION: 4003,
  BUDGET: 4004,
  NOTIFICATION: 4005,
  WORKER: 4006,
};
```

Restart all services after changing.

---

## URLs When Running

| URL | Description |
|-----|-------------|
| http://localhost:3000 | **Main app** — open this |
| http://localhost:3000/sign-in | Login / register |
| http://localhost:3000/dashboard | Dashboard (after login) |
| http://localhost:3000/transaction/create | Add transaction |
| http://localhost:3000/reports | Analytics & charts |
| http://localhost:3000/settings | Profile & sessions |
| http://localhost:3000/subscriptions | Recurring bills |
| http://localhost:3000/splits | Split expense groups |
| http://localhost:3000/split/{token} | Public split invite link |
| http://localhost:8080/health | All services health check |
| http://localhost:8288 | **Inngest Dashboard** |
| http://localhost:5555 | Prisma Studio (`npm run db:studio`) |

---

## First-Time User Walkthrough

After `npm run dev` and successful health check:

### 1. Sign In

- Open http://localhost:3000
- Click **Sign Up** or **Continue with Google**
- You land on `/dashboard`

### 2. Create Bank Account

- Dashboard → **Add New Account**
- Name: `HDFC Savings` (or anything)
- Type: Savings or Current
- Click Create

### 3. Add First Transaction

- Header → **Add Transaction**
- Fill: type (Expense), amount (₹500), description, category, account
- Save → appears on dashboard

### 4. Set Monthly Budget

- Dashboard → **Monthly Budget** widget → pencil icon
- Enter amount (e.g. ₹30000)
- Save

### 5. Create Split Group

- Profile menu (avatar) → **Split Expenses**
- **Create group & get link**
- Name: `Test Trip`
- Link auto-copied — share with a friend

### 6. Send Test Email (if Brevo configured)

- Dashboard → **Email Notifications** → **Send Test Email**
- Check inbox

---

## Testing Every Feature

### Authentication

| Test | Steps | Expected |
|------|-------|----------|
| Google login | Sign in → Continue with Google | Redirect to dashboard |
| Email register | Sign up with email/password | Account created, logged in |
| Email login | Sign in with credentials | Dashboard |
| Logout | Profile menu → Log out | Redirect to landing |
| Session list | Settings → Active Sessions | Shows current session |
| Logout all | Settings → Log out all devices | All sessions revoked |

### Accounts & Transactions

| Test | Steps | Expected |
|------|-------|----------|
| Create account | Dashboard → Add New Account | Account card appears |
| Set default | Account card → star/default | Default badge shown |
| Add expense | Add Transaction → fill form | Balance decreases |
| Add income | Add Transaction → type Income | Balance increases |
| Receipt scan | Add Transaction → upload photo | AI fills fields (needs Groq) |
| Edit transaction | Account page → edit row | Updated |
| Bulk delete | Account page → select rows → delete | Rows removed |
| CSV import | Settings → Import CSV | Transactions imported |

### Budget & Goals

| Test | Steps | Expected |
|------|-------|----------|
| Monthly budget | Dashboard → budget widget → edit | Progress bar updates |
| Category budget | Dashboard → Category Budgets | Per-category limits |
| Savings goal | Dashboard → Savings Goals → add | Progress tracked |

### Analytics & Reports

| Test | Steps | Expected |
|------|-------|----------|
| Health score | Dashboard widget | Score 0–100 shown |
| Net worth chart | Dashboard 3D chart | Timeline renders |
| Reports page | Header → Reports | Charts + insights |
| PDF export | Reports → Export PDF | File downloads |
| AI coach | Dashboard → AI Coach → ask question | AI response (needs Groq) |

### Subscriptions

| Test | Steps | Expected |
|------|-------|----------|
| Add bill | Subscriptions → Add Bill | Bill listed |
| Edit bill | Bill card → edit | Updated |
| Delete bill | Bill card → remove | Removed |

### Dashboard Widgets

| Test | Steps | Expected |
|------|-------|----------|
| Toggle widget | Settings → Dashboard Widgets | Widget shows/hides on dashboard |

---

## Inngest Background Jobs

### Access Dashboard

1. Ensure `npm run dev` is running
2. Open **http://localhost:8288**
3. All functions appear under your app

### All 7 Functions

| # | Function | Trigger | What It Does |
|---|----------|---------|--------------|
| 1 | `process-recurring-transaction` | Event | Creates one recurring transaction |
| 2 | `trigger-recurring-transactions` | Daily midnight cron | Finds due bills → fires events |
| 3 | `generate-monthly-reports` | 1st of month cron | AI monthly email to all users |
| 4 | `check-budget-alerts` | Every 6h cron | Email when 80%+ budget used |
| 5 | `check-category-budget-alerts` | Every 6h cron | Category budget warnings |
| 6 | `send-bill-reminders` | Daily 9 AM cron | Bill due in 3 days reminder |
| 7 | `send-weekly-digests` | Monday 9 AM cron | Weekly spending summary |

### Manual Invoke (Dev)

1. Open http://localhost:8288
2. Click function name
3. Click **Invoke**

**Useful test payloads:**

```json
// Budget alert — force send even if under 80%
{ "force": true }

// Bill reminder — look 30 days ahead (dev default is 30, prod is 3)
{ "force": true, "daysAhead": 30 }

// Weekly digest — send even with no activity
{ "force": true }
```

### Prerequisites for Email Jobs

- Brevo configured in notification-service
- Worker-service running on :4006
- `INTERNAL_SERVICE_SECRET` matches in worker + notification

### Inngest Only (without full dev)

```sh
# Terminal 1 — worker must be running
npm run dev -w @wisewallet/worker-service

# Terminal 2 — inngest dev server
npm run dev:inngest
```

---

## Email Testing (CLI & UI)

### From Dashboard UI

1. Login → Dashboard
2. Scroll to **Email Notifications**
3. Click **Send Test Email**
4. Check list below for status (`sent` / `failed`)
5. Check your inbox

### From CLI

```sh
# Send test email directly via notification-service
npm run email:test

# Trigger budget alert email manually
npm run email:budget-alert
```

### Email Types You'll Receive

| Type | When |
|------|------|
| Test | Manual trigger |
| Budget alert | 80%+ monthly budget spent |
| Category budget alert | 80%+ category budget spent |
| Bill reminder | Recurring bill due soon |
| Weekly digest | Every Monday |
| Monthly report | 1st of each month |

---

## Split Expenses Setup & Test

Splits work **without bank accounts** — Splitwise-style.

### Create a Group

1. Login → Profile menu → **Split Expenses** (or `/splits`)
2. Click **Create group & get link**
3. Enter name: `Goa Trip`
4. Link copied to clipboard automatically

Invite URL format:

```
http://localhost:3000/split/f8dc67ba-596e-4655-aa9e-237d776f703a
```

### Share & Join

1. Send link to friend (WhatsApp / copy)
2. Friend opens link → sees group preview
3. Friend clicks **Join** → redirected to sign-in if not logged in
4. After login → automatically joins group

### Add Expense

1. Open group card → **Add expense**
2. Description: `Dinner`
3. Amount: `1200`
4. Who paid: select member
5. Save → split equally among all members

### Settle Up

1. **Settle up** button on group card
2. See "who owes whom" suggestions
3. Record payment when someone pays back

### Test via API (Optional)

```sh
# Get JWT by logging in, then:
curl -X POST http://localhost:8080/api/splits \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"title":"API Test Group","members":[]}'
```

### Split Troubleshooting

| Problem | Fix |
|---------|-----|
| "Please select a bank account" on create | Gateway routing bug — ensure latest `api-gateway/src/index.js` is running |
| Empty group cards | Hard refresh + `npm run dev:clean` |
| Friend can't join | They must sign in first; link redirects to `/sign-in?redirect=/split/{token}` |
| localhost link in production | Set `NEXT_PUBLIC_APP_URL` to production domain |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install all workspace dependencies |
| `npm run setup:env` | Copy all `.env.example` → `.env` (9 files) |
| `npm run dev` | Start all 9 processes |
| `npm run dev:clean` | Clear caches + start dev |
| `npm run clean` | Clear caches only (no start) |
| `npm run dev:frontend` | Frontend only (:3000) |
| `npm run dev:gateway` | API Gateway only (:8080) |
| `npm run dev:inngest` | Inngest Dev Server only (:8288) |
| `npm run build` | Build frontend for production |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to Neon (dev) |
| `npm run db:migrate` | Create migration (dev) |
| `npm run db:migrate:deploy` | Apply migrations (production) |
| `npm run db:studio` | Open Prisma Studio (:5555) |
| `npm run db:seed` | Seed demo transactions |
| `npm run email:test` | Send test email via CLI |
| `npm run email:budget-alert` | Trigger budget alert email via CLI |

---

## Auth Flow (How Login Works)

### Google OAuth

```
1. User clicks "Continue with Google" on /sign-in
2. Browser → GET /api/auth/google
3. Next.js rewrite → gateway :8080 → auth-service :4001
4. auth-service redirects → Google login page
5. User approves → Google redirects to:
   http://localhost:8080/api/auth/google/callback
6. auth-service:
   - Finds or creates User in Neon
   - Creates UserSession with refresh token
   - Signs JWT (1 hour expiry)
7. Redirect → http://localhost:3000/auth/callback?token=xxx&refreshToken=yyy
8. Frontend auth/callback/page.jsx:
   - Saves tokens to localStorage + cookie
   - Redirects to /dashboard (or ?redirect= path for split invites)
9. All API calls include:
   Authorization: Bearer <access_token>
   X-Refresh-Token: <refresh_token>
```

### Email + Password

```
POST /api/auth/register  { email, password, name }
POST /api/auth/login     { email, password }
→ { token, refreshToken, user }
→ stored client-side → redirect to /dashboard
```

### Token Refresh (Automatic)

```
Any API call returns 401
→ frontend/lib/api.js calls POST /api/auth/refresh
→ new tokens issued
→ original request retried
→ if refresh fails → logout → /sign-in
```

### Protected Routes

`frontend/middleware.js` checks `auth_token` cookie for:

```
/dashboard, /account, /transaction, /reports,
/settings, /subscriptions, /splits
```

Unauthenticated → redirect to `/sign-in`.

---

## Verification Checklist

Run through this after setup to confirm everything works:

```
[ ] npm install completed without errors
[ ] npm run setup:env — all 9 .env files exist
[ ] DATABASE_URL set in all 7 DB-connected services
[ ] JWT_SECRET identical in 5 services
[ ] npm run db:generate — no errors
[ ] npm run db:push — "in sync" message
[ ] npm run dev — all 9 processes start
[ ] curl http://localhost:8080/health — all "ok"
[ ] http://localhost:3000 — landing page loads
[ ] Google login works → dashboard
[ ] Create bank account works
[ ] Add transaction works
[ ] (Optional) Receipt scan works — Groq configured
[ ] (Optional) Test email sends — Brevo configured
[ ] (Optional) http://localhost:8288 — 7 Inngest functions visible
[ ] Split group create works — invite link copied
```

---

## Troubleshooting

### Port Already in Use

```sh
# Mac/Linux — find process on port 3000
lsof -i :3000
kill -9 <PID>

# Check all WiseWallet ports
lsof -i :3000 -i :4001 -i :4002 -i :4003 -i :4004 -i :4005 -i :4006 -i :8080 -i :8288
```

Or change ports in `packages/shared/src/index.js`.

### Stale / Old UI Showing

```sh
npm run dev:clean
# Browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
# Or try incognito window
```

### Google Login Redirect Error

| Symptom | Fix |
|---------|-----|
| `redirect_uri_mismatch` | URI must be exactly `http://localhost:8080/api/auth/google/callback` |
| Redirects to wrong page | Check `WEB_URL=http://localhost:3000` in auth-service + gateway |
| `access_denied` | Add your Gmail as test user in Google OAuth consent screen |
| Blank page after Google | Check auth-service logs in terminal |

### Database Connection Failed

```
Error: P1001: Can't reach database server
```

Fixes:
- Verify `DATABASE_URL` in **all** service `.env` files
- Neon project must be **active** (not paused — free tier pauses after inactivity)
- URL must include `?sslmode=require`
- Wake Neon: open Neon dashboard → project auto-resumes

### 401 Unauthorized on API Calls

- Login again — access token expires after 1 hour
- Check `JWT_SECRET` is **identical** in:
  - auth-service, account-service, transaction-service, budget-service, notification-service
- Clear browser storage: DevTools → Application → Local Storage → clear `wisewallet_token`

### "Please select a bank account" on Splits Page

This was a **gateway routing bug** (fixed). `/api/splits` was hitting transaction create instead of splits router.

Fix:
1. Pull latest code
2. Restart dev server
3. Verify `api-gateway/src/index.js` has splits path rewrite function

### Emails Not Sending

1. **Brevo sender not verified** — most common cause
   - Brevo dashboard → Senders & Domains → verify email
2. Check `BREVO_API_KEY` in notification-service `.env`
3. Check `EMAIL_FROM` matches verified sender exactly
4. Check `INTERNAL_SERVICE_SECRET` matches in notification + worker
5. Dashboard → Email Notifications → check for `failed` status with error message

### ArcJet Not Working / Blocking Requests

- Set `ARCJET_KEY` in gateway, account-service, transaction-service
- Restart all services
- Console should show: `[api-gateway] ArcJet shield + bot detection enabled`
- **curl requests may be blocked** — test in browser instead
- To disable: remove `ARCJET_KEY` from `.env` files (dev only)

### Inngest Functions Not Showing

1. `npm run dev` must be running (includes Inngest)
2. Worker service must be up on port 4006
3. Open http://localhost:8288 manually
4. Check worker terminal for errors

### Groq / Receipt Scan Fails

- Check `GROQ_API_KEY` in transaction-service `.env`
- Upload a **clear, well-lit** receipt photo
- Check transaction-service logs for Groq API errors
- Free tier has rate limits

### npm install Errors

```sh
# Clear and reinstall
rm -rf node_modules
rm -rf frontend/node_modules
npm install
```

### Service Health Check

```sh
curl http://localhost:8080/health | python3 -m json.tool
```

Expected — all services `"status": "ok"`:

```json
{
  "gateway": "ok",
  "services": [
    { "name": "auth", "status": "ok" },
    { "name": "account", "status": "ok" },
    { "name": "transaction", "status": "ok" },
    { "name": "budget", "status": "ok" },
    { "name": "notification", "status": "ok" },
    { "name": "worker", "status": "ok" }
  ]
}
```

If any service shows `"status": "down"` — check that service's terminal output for errors.

### icon.svg 500 Error in Console

```
A conflicting public file and page file was found for path /icon.svg
```

Cosmetic issue — does not affect app functionality. Can be ignored in dev.

### Split Groups Empty / Wrong Data

- Run `npm run dev:clean` + hard refresh
- Check `GET /api/splits` returns `{ groups: [...] }` not a raw array
- Verify split tables exist: `npm run db:push`

---

## Production Preparation

When moving from local dev to production:

### 1. Update All URLs

| Variable | Local | Production Example |
|----------|-------|--------------------|
| `WEB_URL` | `http://localhost:3000` | `https://wisewallet.app` |
| `API_GATEWAY_URL` | `http://localhost:8080` | `https://api.wisewallet.app` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://wisewallet.app` |
| `GOOGLE_CALLBACK_URL` | localhost:8080/... | `https://api.wisewallet.app/api/auth/google/callback` |
| `FRONTEND_URL` | localhost:3000 | `https://wisewallet.app` |

### 2. Google OAuth Production

Add to Google Cloud Console:
- Authorized origins: `https://wisewallet.app`, `https://api.wisewallet.app`
- Redirect URI: `https://api.wisewallet.app/api/auth/google/callback`
- Publish OAuth consent screen (move out of "Testing")

### 3. Database

```sh
npm run db:migrate:deploy
```

Use Neon **production branch** — separate from dev.

### 4. Inngest Production

Add to `worker-service/.env`:

```env
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

Register app at [inngest.com](https://www.inngest.com) with serve URL:
`https://api.yourdomain.com/api/inngest`

### 5. Security Checklist

- [ ] New strong `JWT_SECRET` per environment (never reuse dev secret)
- [ ] New `INTERNAL_SERVICE_SECRET` per environment
- [ ] ArcJet enabled on gateway + mutation services
- [ ] CORS `WEB_URL` set to production domain only
- [ ] Brevo sender domain verified (not just email)
- [ ] All `.env` files excluded from git (never commit secrets)

### 6. Deploy Each Service

Each microservice needs its own host (Railway, Render, Fly.io, etc.):

| Service | Suggested Platform |
|---------|-------------------|
| frontend | Vercel |
| api-gateway | Railway / Render |
| auth-service | Railway / Render |
| account-service | Railway / Render |
| transaction-service | Railway / Render |
| budget-service | Railway / Render |
| notification-service | Railway / Render |
| worker-service | Railway / Render |

---

## Where to Get API Keys (Quick Reference)

| Variable | Where | Free Tier |
|----------|-------|-----------|
| `DATABASE_URL` | [neon.tech](https://neon.tech) | Yes |
| `JWT_SECRET` | `openssl rand -base64 32` | — |
| `INTERNAL_SERVICE_SECRET` | `openssl rand -hex 24` | — |
| `GOOGLE_CLIENT_ID/SECRET` | [console.cloud.google.com](https://console.cloud.google.com) | Yes |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) | Yes |
| `BREVO_API_KEY` | [brevo.com/settings/keys/api](https://app.brevo.com/settings/keys/api) | 300/day |
| `ARCJET_KEY` | [app.arcjet.com](https://app.arcjet.com) | Yes |
| Inngest (production) | [inngest.com](https://www.inngest.com) | Dev server free locally |

---

Made with 💗 by Shubham Malik

For full project documentation, API reference, and architecture details, see [`README.md`](./README.md).

# WiseWallet — Render Deploy Guide (Free Tier)

**Recommended setup:** Backend **ek bundle** mein Render pe + Frontend **Vercel free** pe (UI fast, backend free).

Alag-alag microservices Render pe mat daalo abhi — gateway localhost use karta hai. Bundle = zero extra code, free tier pe kaam karta hai.

---

## Architecture (free + fast)

```
User
  ↓
Vercel (frontend) — FREE, fast CDN, no cold start
  ↓  /api/* rewrites
Render (wisewallet-api) — FREE, 1 bundled backend
  ↓  localhost:4001–4006
Neon PostgreSQL — FREE tier
Inngest Cloud — FREE tier (cron + emails)
```

**Cost: ₹0** (free tiers). Trade-off: Render backend **15 min idle ke baad sleep** → pehli API call ~30–60 sec (cold start).

---

## Step 1 — Database (Neon)

1. [neon.tech](https://neon.tech) → project → **Create branch** `production` (optional, recommended)
2. Copy `DATABASE_URL`
3. Local pe schema sync:

```bash
# packages/database/.env mein production URL daalo, phir:
npm run db:push
# OR fresh branch pe:
npm run db:migrate:deploy
```

Agar `P3005` error aaye → purani DB pe `db:push` use karo (README troubleshooting dekho).

---

## Step 2 — Backend on Render (BUNDLE — ek service)

### 2.1 Render account

1. [render.com](https://render.com) → Sign up with GitHub
2. **New → Blueprint** → connect `WiseWallet` repo  
   **OR** **New → Web Service** manually

### 2.2 Web Service settings

| Field | Value |
|-------|-------|
| Name | `wisewallet-api` |
| Region | **Singapore** (India ke liye thoda fast) |
| Branch | `main` |
| Root Directory | *(blank — repo root)* |
| Runtime | Node |
| Build Command | `npm install && npm run db:generate` |
| Start Command | `sh scripts/start-backend.sh` |
| Plan | **Free** |
| Health Check Path | `/health` |

### 2.3 Environment variables (Render dashboard → Environment)

Copy-paste karke values bharo:

```env
NODE_ENV=production

# Database (same URL sab services ko Render env se milta hai — start script sab start karta hai)
DATABASE_URL=postgresql://...@...neon.tech/neondb?sslmode=require

# Auth (generate: openssl rand -base64 32)
JWT_SECRET=your-long-random-secret

# Frontend URL (Step 3 ke baad update karo agar pehle blank ho)
WEB_URL=https://YOUR-APP.vercel.app
FRONTEND_URL=https://YOUR-APP.vercel.app
CORS_ORIGINS=https://YOUR-APP.vercel.app

# Google OAuth — callback = RENDER API URL
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_CALLBACK_URL=https://wisewallet-api.onrender.com/api/auth/google/callback

# AI
GROQ_API_KEY=gsk_xxx

# Email
BREVO_API_KEY=xkeysib-xxx
EMAIL_FROM=WiseWallet <noreply@yourdomain.com>
INTERNAL_SERVICE_SECRET=your-hex-secret

# Security (optional but recommended)
ARCJET_KEY=ajkey_xxx

# Bundled — internal, mat badlo
NOTIFICATION_SERVICE_URL=http://localhost:4005

# Inngest Cloud (https://app.inngest.com)
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

> **Note:** Render ek hi env block sab processes ko deta hai — bundled deploy mein yeh theek hai.

### 2.4 Deploy

Click **Create Web Service** → wait ~5–10 min.

**API URL milega:**
```
https://wisewallet-api.onrender.com
```

### 2.5 Test

```bash
curl https://wisewallet-api.onrender.com/health
```

Sab services `"status": "ok"` honi chahiye.

---

## Step 3 — Frontend on Vercel (FREE + FAST)

Render pe frontend mat daalo free tier pe — do services sleep karenge. **Vercel = fast UI.**

1. [vercel.com](https://vercel.com) → Import GitHub repo
2. Settings:

| Field | Value |
|-------|-------|
| Root Directory | `frontend` |
| Framework | Next.js |
| Build Command | `cd .. && npm install && npm run build -w @wisewallet/frontend` |
| Output | default |

3. Environment Variables:

```env
API_GATEWAY_URL=https://wisewallet-api.onrender.com
NEXT_PUBLIC_APP_URL=https://YOUR-PROJECT.vercel.app
```

4. Deploy → copy Vercel URL

5. **Wapas Render pe** update karo:
```env
WEB_URL=https://YOUR-PROJECT.vercel.app
FRONTEND_URL=https://YOUR-PROJECT.vercel.app
CORS_ORIGINS=https://YOUR-PROJECT.vercel.app
```

---

## Step 4 — Google OAuth

[Google Cloud Console](https://console.cloud.google.com) → Credentials:

**Authorized JavaScript origins:**
```
https://YOUR-PROJECT.vercel.app
https://wisewallet-api.onrender.com
```

**Redirect URI:**
```
https://wisewallet-api.onrender.com/api/auth/google/callback
```

OAuth consent screen → Testing se hata ke **Publish** karo (production ke liye).

---

## Step 5 — Inngest (background jobs)

1. [app.inngest.com](https://app.inngest.com) → Create app
2. **Serve URL:** `https://wisewallet-api.onrender.com/api/inngest`
3. Copy `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` → Render env
4. Redeploy Render service

---

## Step 6 — Final test

```
[ ] https://YOUR-PROJECT.vercel.app — landing load
[ ] Google login → dashboard
[ ] Add account + transaction
[ ] Split group create
[ ] curl /health — all ok
```

---

## Free tier tips (thoda fast rakhne ke liye)

| Tip | Kyun |
|-----|------|
| Frontend **Vercel** pe rakho | UI hamesha fast, cold start nahi |
| Render region **Singapore** | India se latency kam |
| [UptimeRobot](https://uptimerobot.com) free ping har 5 min | Backend sleep kam hota hai (optional) |
| Pehli request slow accept karo | Cold start ~30–60s normal hai free pe |

---

## Alag-alag services kab karein?

Jab traffic badhe ya team bade — tab 7 alag Render services + gateway env URLs. Abhi ke liye **bundle = best**.

Code change chahiye hoga alag deploy ke liye — baad mein Agent se karwa lena.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `/health` mein services `"down"` | Logs dekho — `sleep 5` badha sakte ho `start-backend.sh` mein |
| Google login fail | `GOOGLE_CALLBACK_URL` + Google Console URI match karo |
| CORS error | `WEB_URL` + `CORS_ORIGINS` = exact Vercel URL |
| 502 on API | Cold start — 1 min wait, retry |
| DB error | `DATABASE_URL` + Neon active hai verify karo |

---

Made with 💗 for WiseWallet deploy

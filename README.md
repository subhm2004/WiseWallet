<div align="center">

<!-- Animated waving header -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=24&height=180&section=header&text=WiseWallet&fontSize=72&fontAlignY=38&desc=AI-Powered+Personal+Finance+Platform+%F0%9F%92%B0&descAlignY=58&descSize=18" width="100%" alt="WiseWallet Header"/>

<!-- Typing animation -->
<img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=24&duration=2800&pause=900&color=F97316&center=true&vCenter=true&width=940&lines=Track+%E2%82%B9+Expenses+%C2%B7+Split+Bills+with+Friends;AI+Receipt+Scan+%C2%B7+Budget+Alerts+%C2%B7+Finance+Coach;Built+for+India+%C2%B7+Microservices+%C2%B7+Production-Ready" alt="Typing animation"/>

<br/>

<!-- Badges -->
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Express](https://img.shields.io/badge/Express-Microservices-000000?style=for-the-badge&logo=express)
![PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![Groq](https://img.shields.io/badge/Groq-AI-F55036?style=for-the-badge)
![Inngest](https://img.shields.io/badge/Inngest-Jobs-000000?style=for-the-badge)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

<br/>

[![Setup Guide](https://img.shields.io/badge/Setup_Guide-setup.md-181717?style=for-the-badge&logo=github)](./setup.md)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

<br/>

**Currency: Indian Rupee (₹)** — designed for Indian users with INR formatting throughout.

[Features](#-key-features) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [API Docs](#-api-reference) · [Splits](#-split-expenses-splitwise-style) · [Troubleshooting](#-troubleshooting)

</div>

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#-key-features)
3. [Tech Stack](#-tech-stack)
4. [Architecture](#-architecture)
5. [Data Model](#-data-model)
6. [Authentication Flow](#-authentication-flow)
7. [Split Expense Flow](#-split-expense-flow)
8. [Project Structure](#-project-structure)
9. [Prerequisites](#-prerequisites)
10. [Quick Start](#-quick-start)
11. [Full Setup From Scratch](#-full-setup-from-scratch)
12. [Environment Variables](#-environment-variables)
13. [Where to Get API Keys](#-where-to-get-api-keys)
14. [Database](#-database)
15. [API Gateway & Routing](#-api-gateway--routing)
16. [API Reference](#-api-reference)
17. [Frontend Routes & Pages](#-frontend-routes--pages)
18. [Authentication & Sessions](#-authentication--sessions)
19. [Split Expenses (Splitwise-style)](#-split-expenses-splitwise-style)
20. [Background Jobs (Inngest)](#-background-jobs-inngest)
21. [Email System](#-email-system)
22. [Security (ArcJet, JWT, Rate Limits)](#-security-arcjet-jwt-rate-limits)
23. [PWA & Offline](#-pwa--offline)
24. [Available Scripts](#-available-scripts)
25. [URLs When Running](#-urls-when-running)
26. [Testing Features](#-testing-features)
27. [Troubleshooting](#-troubleshooting)
28. [Production Deployment Notes](#-production-deployment-notes)
29. [Roadmap & Known Limitations](#-roadmap--known-limitations)
30. [Credits](#-credits)

---

## Overview

WiseWallet is a **full-stack personal finance platform** built as a **monorepo** with **microservices architecture**. Track expenses, set budgets, scan receipts with AI, split bills with friends, and get personalized financial insights — all in **₹ INR**.

```mermaid
mindmap
  root((WiseWallet))
    Track
      Bank Accounts
      Transactions
      Receipt AI Scan
      CSV Import/Export
    Plan
      Monthly Budget
      Category Budgets
      Savings Goals
      Subscriptions
    Analyze
      Dashboard Widgets
      Health Score
      3D Net Worth Chart
      AI Finance Coach
    Share
      Split Groups
      Invite Links
      Settle Up
      No Bank Account Needed
    Automate
      Inngest Cron Jobs
      Budget Alerts
      Bill Reminders
      Weekly Digest
      Monthly AI Report
```

The backend uses a **microservices pattern** — each domain (auth, accounts, transactions, budget, notifications, workers) runs as an independent Express service. A single **API Gateway** on port `8080` is the only entry point the frontend talks to.

---

## ✨ Key Features

### Authentication & Profile

| Feature | Description |
|---------|-------------|
| Google OAuth | One-click sign-in via Google |
| Email + Password | Register, login, forgot/reset password |
| JWT + Refresh Tokens | Short-lived access token + rotating refresh token |
| Session Management | View active sessions, revoke individual sessions, logout all devices |
| Profile | Update name; dashboard widget preferences stored on user |

### Bank Accounts

| Feature | Description |
|---------|-------------|
| Multi-account | Current & Savings account types |
| Default account | Set one account as default for budget tracking |
| Edit / Delete | Rename, change type; delete with transaction migration to another account |
| Balance tracking | Balance updates automatically on income/expense transactions |

### Transactions

| Feature | Description |
|---------|-------------|
| Income & Expense | Full CRUD with category, date, description |
| Receipt AI Scan | Upload photo → Groq extracts amount, merchant, category |
| CSV Import | Preview + import bank CSV with duplicate detection & category rules |
| CSV/PDF Export | Download all transactions or monthly PDF report |
| Bulk Delete | Select multiple transactions and delete at once |
| Category Rules | Auto-categorize by description pattern (e.g. "SWIGGY" → Food) |
| Recurring Bills | Daily / Weekly / Monthly / Yearly recurring transactions |

### Budget & Goals

| Feature | Description |
|---------|-------------|
| Monthly Budget | Set total monthly spending limit on default account |
| Category Budgets | Per-category limits (Food, Transport, etc.) |
| Savings Goals | Target amount + deadline + progress tracking |
| Budget Alerts | Email when 80%+ of budget is used (via Inngest cron) |

### Analytics & Reports

| Feature | Description |
|---------|-------------|
| Dashboard Overview | Net worth, income vs expenses, account cards |
| Health Score | Financial health rating based on spending patterns |
| Net Worth Timeline | 3D + 2D charts over 6 months |
| Reports Page | Monthly trends, category donut chart, AI insights |
| AI Finance Coach | Ask natural-language questions about your spending |
| Subscription Detection | Auto-detect recurring expenses from transaction history |

### Split Expenses (Splitwise-style)

| Feature | Description |
|---------|-------------|
| Create Group | Name only — no bank account needed |
| Invite Link | Share `/split/{token}` — friends join after login |
| Add Expenses | Equal split among all members |
| Settle Up | See who owes whom; record payments |
| Member Roles | Owner vs member; owner can delete group |
| Public Preview | Anyone with link can preview group before joining |

### Email Notifications (Brevo)

| Email Type | Trigger |
|------------|---------|
| Test Email | Manual from dashboard |
| Budget Alert | 80%+ monthly budget used |
| Category Budget Alert | 80%+ category budget used |
| Bill Reminder | Recurring bill due in 3 days |
| Weekly Digest | Every Monday — last 7 days summary |
| Monthly Report | 1st of month — AI insights for last month |

### Dashboard Customization

Toggle widgets in **Settings → Dashboard Widgets**:

- Net Worth, Health Score, 3D Timeline
- Monthly Budget, Category Budgets, Savings Goals
- AI Coach, Reports Card, Subscriptions Card
- Recent Activity, Accounts

### PWA

- Web app manifest
- Service worker for offline basics
- Installable on mobile/desktop

---

## 🛠 Tech Stack

```mermaid
graph LR
    subgraph Frontend["Frontend :3000"]
        N[Next.js 15]
        R[React 18]
        T[Tailwind CSS]
        S[shadcn/ui]
        C[Recharts + Three.js]
    end

    subgraph Gateway["API Gateway :8080"]
        G[Express Proxy]
        A[ArcJet Shield]
    end

    subgraph Services["Microservices"]
        AUTH[auth :4001]
        ACC[account :4002]
        TXN[transaction :4003]
        BUD[budget :4004]
        NOTIF[notification :4005]
        WRK[worker :4006]
    end

    subgraph Data["Data & AI"]
        DB[(Neon PostgreSQL)]
        PR[Prisma ORM]
        GQ[Groq LLM]
    end

    subgraph External["External"]
        GOOG[Google OAuth]
        BR[Brevo Email]
        ING[Inngest Jobs]
        AJ[ArcJet WAF]
    end

    Frontend --> Gateway
    Gateway --> AUTH & ACC & TXN & BUD & NOTIF
    AUTH & ACC & TXN & BUD & NOTIF --> DB
    TXN --> GQ
    NOTIF --> BR
    WRK --> ING & GQ & NOTIF
    AUTH --> GOOG
    Gateway --> AJ
```

### Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js 15** | App Router, SSR, API rewrites to gateway |
| **React 18** | UI components |
| **Tailwind CSS** | Styling + dark mode |
| **shadcn/ui + Radix** | Accessible UI primitives |
| **React Hook Form + Zod** | Form validation |
| **Recharts + Three.js** | 2D charts + 3D net worth visualization |
| **Sonner** | Toast notifications |
| **next-themes** | Dark/light mode |

### Backend (Microservices)

| Service | Port | Stack |
|---------|------|-------|
| api-gateway | 8080 | Express, http-proxy-middleware, ArcJet |
| auth-service | 4001 | Express, Passport Google OAuth, bcrypt, JWT |
| account-service | 4002 | Express, Prisma, ArcJet rate limits |
| transaction-service | 4003 | Express, Prisma, Groq, Multer, PDFKit |
| budget-service | 4004 | Express, Prisma |
| notification-service | 4005 | Express, Brevo SDK |
| worker-service | 4006 | Express, Inngest, Groq |

### Shared Packages

| Package | Purpose |
|---------|---------|
| `@wisewallet/database` | Prisma schema + Neon PostgreSQL client |
| `@wisewallet/shared` | JWT helpers, ArcJet config, service ports, currency utils |

### External Services

| Service | Purpose |
|---------|---------|
| **Neon** | Serverless PostgreSQL |
| **Google Cloud** | OAuth 2.0 |
| **Groq** | LLM for receipt scan, AI coach, monthly insights |
| **Brevo** | Transactional emails |
| **ArcJet** | WAF, bot detection, rate limiting |
| **Inngest** | Background jobs & cron scheduling |

---

## 🏗 Architecture

### System Overview

```mermaid
flowchart TB
    Browser["🌐 Browser<br/>localhost:3000"]
    Next["⚡ Next.js Frontend<br/>API rewrites /api/*"]
    GW["🚪 API Gateway :8080<br/>CORS · ArcJet · Proxy"]

    AUTH["🔐 auth-service :4001"]
    ACC["🏦 account-service :4002"]
    TXN["💳 transaction-service :4003<br/>+ splits"]
    BUD["📊 budget-service :4004"]
    NOTIF["📧 notification-service :4005"]
    WRK["⚙️ worker-service :4006"]
    ING["⏰ Inngest Dev :8288"]

    DB[("🗄 Neon PostgreSQL<br/>Prisma ORM")]

    Browser --> Next
    Next -->|"POST /api/transactions"| GW
    GW --> AUTH & ACC & TXN & BUD & NOTIF
    AUTH & ACC & TXN & BUD & NOTIF --> DB
    WRK --> DB
    WRK --> NOTIF
    ING <-->|webhooks| WRK

    style GW fill:#f97316,color:#fff
    style DB fill:#4169E1,color:#fff
    style Browser fill:#18181b,color:#fff
```

### Request Flow — Create Transaction

```mermaid
sequenceDiagram
    actor User
    participant UI as Next.js Frontend
    participant GW as API Gateway :8080
    participant TXN as transaction-service :4003
    participant DB as Neon PostgreSQL

    User->>UI: Submit transaction form
    UI->>GW: POST /api/transactions + JWT
    GW->>GW: ArcJet bot check
    GW->>TXN: Proxy POST /
    TXN->>TXN: Verify JWT + rate limit
    TXN->>DB: Create transaction + update balance
    DB-->>TXN: OK
    TXN-->>GW: 201 Created
    GW-->>UI: JSON response
    UI-->>User: Toast success → redirect dashboard
```

### Monorepo Workspaces

```json
"workspaces": [
  "frontend",
  "api-gateway",
  "server/*",
  "packages/*"
]
```

All packages are npm workspaces. Run commands from root with `-w @wisewallet/<package>`.

---

## 🗃 Data Model

```mermaid
erDiagram
    User ||--o{ UserSession : has
    User ||--o{ Account : owns
    User ||--o{ Transaction : records
    User ||--o{ Budget : sets
    User ||--o{ CategoryBudget : sets
    User ||--o{ SavingsGoal : tracks
    User ||--o{ CategoryRule : defines
    User ||--o{ SplitGroup : creates
    User ||--o{ EmailLog : receives

    Account ||--o{ Transaction : contains
    Account ||--o| Budget : "default for"

    SplitGroup ||--o{ SplitMember : has
    SplitGroup ||--o{ SplitExpense : contains
    SplitGroup ||--o{ SplitSettlement : records

    SplitExpense ||--o{ SplitShare : "split into"
    SplitMember ||--o{ SplitShare : owes

    User {
        string id PK
        string email
        string name
        string googleId
        json dashboardWidgets
    }

    Account {
        string id PK
        string userId FK
        string name
        enum type
        decimal balance
        boolean isDefault
    }

    Transaction {
        string id PK
        string accountId FK
        enum type
        decimal amount
        string category
        date date
    }

    SplitGroup {
        string id PK
        string title
        string inviteToken
        string ownerId FK
    }

    SplitExpense {
        string id PK
        string groupId FK
        decimal amount
        string paidByMemberId FK
    }
```

### Enums

- `TransactionType`: `INCOME`, `EXPENSE`
- `AccountType`: `CURRENT`, `SAVINGS`
- `TransactionStatus`: `PENDING`, `COMPLETED`, `FAILED`
- `RecurringInterval`: `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`

---

## 🔐 Authentication Flow

### Google OAuth

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant GW as Gateway
    participant AUTH as auth-service
    participant Google as Google OAuth
    participant DB as Neon

    User->>FE: Click "Continue with Google"
    FE->>GW: GET /api/auth/google
    GW->>AUTH: Proxy
    AUTH->>Google: Redirect to consent
    Google->>User: Login screen
    User->>Google: Approve
    Google->>AUTH: Callback with profile
    AUTH->>DB: Upsert User + UserSession
    AUTH->>FE: Redirect /auth/callback?token=...
    FE->>FE: Store JWT + refresh token
    FE->>User: Redirect /dashboard
```

### Email Login + Token Refresh

```mermaid
flowchart LR
    A[POST /api/auth/login] --> B{Valid credentials?}
    B -->|Yes| C[Issue JWT 1h + Refresh 30d]
    B -->|No| D[401 Error]
    C --> E[Store tokens client-side]

    F[API call returns 401] --> G[POST /api/auth/refresh]
    G --> H{Refresh valid?}
    H -->|Yes| I[New tokens + retry request]
    H -->|No| J[Clear tokens → /sign-in]
```

---

## 🤝 Split Expense Flow

```mermaid
flowchart TD
    A[Owner creates group] --> B[Get invite link /split/token]
    B --> C[Share via WhatsApp / Copy]
    C --> D{Friend has account?}
    D -->|No| E[Sign up / Sign in]
    D -->|Yes| F[Open invite link]
    E --> F
    F --> G[Join group]
    G --> H[Add shared expense]
    H --> I[Equal split calculated]
    I --> J[View balances — who owes whom]
    J --> K[Record settlement]
    K --> L[Balances updated]

    style A fill:#f97316,color:#fff
    style B fill:#fb923c,color:#fff
```

> **No bank account required** for splits — completely separate from personal transactions.

---

## 📁 Project Structure

```
WiseWallet/
├── frontend/                          # Next.js 15 UI (:3000)
│   ├── app/
│   │   ├── (auth)/                    # Sign-in, reset password
│   │   ├── (main)/                    # Protected app pages
│   │   │   ├── dashboard/             # Main dashboard + widgets
│   │   │   ├── account/[id]/          # Account detail + transactions
│   │   │   ├── transaction/create/    # Add/edit transaction
│   │   │   ├── reports/               # Analytics & charts
│   │   │   ├── settings/              # Profile, sessions, widgets
│   │   │   ├── subscriptions/         # Recurring bills
│   │   │   └── splits/                # Split expense groups
│   │   ├── split/[token]/             # Public invite join page
│   │   ├── auth/callback/             # OAuth token handler
│   │   └── page.js                    # Landing page
│   ├── components/                    # UI components, header, drawers
│   ├── lib/                           # api.js, auth, currency, widgets
│   ├── hooks/                         # useFetch, etc.
│   ├── data/landing.js                # Landing page content
│   └── middleware.js                  # Route protection
│
├── api-gateway/                       # Single API entry (:8080)
│   └── src/index.js                   # Proxy routes to all services
│
├── server/
│   ├── auth-service/                  # OAuth + JWT + sessions (:4001)
│   ├── account-service/               # Bank accounts CRUD (:4002)
│   ├── transaction-service/           # Transactions, splits, AI (:4003)
│   │   └── src/splits.js              # Collaborative split expenses
│   ├── budget-service/                # Budgets & goals (:4004)
│   ├── notification-service/          # Brevo emails (:4005)
│   └── worker-service/                # Inngest jobs (:4006)
│       └── src/inngest/functions.js   # 7 background functions
│
├── packages/
│   ├── database/
│   │   └── prisma/
│   │       ├── schema.prisma          # Full data model
│   │       └── migrations/            # SQL migrations
│   └── shared/
│       └── src/                       # JWT, ArcJet, ports, currency
│
├── scripts/
│   ├── setup-env.sh                   # Copy .env.example → .env
│   └── clean-cache.sh                 # Clear Next.js / webpack caches
│
├── package.json                       # Root scripts (dev, db, clean)
├── setup.md                           # Extended setup guide
└── README.md                          # This file
```

---

## 📋 Prerequisites

| Tool | Version | Check Command |
|------|---------|---------------|
| **Node.js** | 18+ (20 recommended) | `node -v` |
| **npm** | 9+ | `npm -v` |
| **Git** | Any recent | `git --version` |

**External accounts needed (for full features):**

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [Neon](https://neon.tech) | PostgreSQL database | ✅ Yes |
| [Google Cloud Console](https://console.cloud.google.com) | OAuth credentials | ✅ Yes |
| [Groq](https://console.groq.com) | AI receipt scan & coach | ✅ Yes |
| [Brevo](https://brevo.com) | Email sending | ✅ 300/day |
| [ArcJet](https://app.arcjet.com) | Security & rate limits | ✅ Yes |

Inngest Dev Server runs locally — **no API key needed for development**.

---

## 🚀 Quick Start

If `.env` files are already configured:

```sh
# 1. Install all workspace dependencies
npm install

# 2. Generate Prisma client & sync schema to Neon
npm run db:generate
npm run db:push

# 3. Start everything (9 processes)
npm run dev
```

Open **http://localhost:3000** → Sign in with Google or email.

**Fresh cache start** (if UI looks stale):

```sh
npm run dev:clean
```

Then hard-refresh browser: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows).

```mermaid
flowchart LR
    A[npm install] --> B[npm run db:generate]
    B --> C[npm run db:push]
    C --> D[npm run dev]
    D --> E[Open localhost:3000]
    E --> F[Sign in & explore 🎉]

    style D fill:#f97316,color:#fff
    style F fill:#22c55e,color:#fff
```

---

## 🔧 Full Setup From Scratch

### Step 1 — Clone & Install

```sh
git clone https://github.com/subhm2004/WiseWallet.git
cd WiseWallet
npm install
```

### Step 2 — Create Environment Files

Each service has its own `.env`. There is **no root `.env`**.

```sh
npm run setup:env
```

This copies every `.env.example` → `.env` in all folders.

### Step 3 — Fill In Credentials

See [Environment Variables](#-environment-variables) and [Where to Get API Keys](#-where-to-get-api-keys).

**Minimum to run:**

- `DATABASE_URL` in all DB-connected services
- `JWT_SECRET` (same value in auth, account, transaction, budget, notification)
- Google OAuth in auth-service
- `API_GATEWAY_URL` in frontend
- `WEB_URL` in api-gateway and auth-service

**Recommended for full experience:**

- `GROQ_API_KEY` — receipt scan + AI coach
- `BREVO_API_KEY` + verified `EMAIL_FROM` — emails
- `ARCJET_KEY` — security & rate limits

### Step 4 — Database

```sh
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to Neon
# OR for production:
npm run db:migrate:deploy
```

### Step 5 — Run

```sh
npm run dev
```

> 📖 For step-by-step screenshots and detailed env setup, see [`setup.md`](./setup.md).

---

## 🔑 Environment Variables

Each service loads its **own** `.env` from its folder via `@wisewallet/shared/src/env.js`.

### `frontend/.env`

```env
API_GATEWAY_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### `api-gateway/.env`

```env
WEB_URL=http://localhost:3000
ARCJET_KEY=ajkey_xxxxxxxx
NODE_ENV=development
```

### `server/auth-service/.env`

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET=your-long-random-secret
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback
WEB_URL=http://localhost:3000
```

### `server/account-service/.env`

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-long-random-secret    # MUST match auth-service
ARCJET_KEY=ajkey_xxxxxxxx             # MUST match gateway
```

### `server/transaction-service/.env`

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-long-random-secret    # MUST match auth-service
GROQ_API_KEY=gsk_xxxxxxxx
ARCJET_KEY=ajkey_xxxxxxxx             # MUST match gateway
```

### `server/budget-service/.env`

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-long-random-secret    # MUST match auth-service
```

### `server/notification-service/.env`

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-long-random-secret
BREVO_API_KEY=xkeysib-xxxxxxxx
EMAIL_FROM=WiseWallet <noreply@yourdomain.com>
INTERNAL_SERVICE_SECRET=random-internal-secret
```

### `server/worker-service/.env`

```env
DATABASE_URL=postgresql://...
GROQ_API_KEY=gsk_xxxxxxxx
INTERNAL_SERVICE_SECRET=random-internal-secret   # MUST match notification-service
NOTIFICATION_SERVICE_URL=http://localhost:4005
# Production Inngest:
# INNGEST_EVENT_KEY=...
# INNGEST_SIGNING_KEY=...
```

### `packages/database/.env`

```env
DATABASE_URL=postgresql://...   # Same Neon URL (for Prisma CLI)
```

### Values That MUST Match

| Variable | Identical In |
|----------|--------------|
| `DATABASE_URL` | auth, account, transaction, budget, notification, worker, packages/database |
| `JWT_SECRET` | auth, account, transaction, budget, notification |
| `ARCJET_KEY` | api-gateway, account-service, transaction-service |
| `INTERNAL_SERVICE_SECRET` | notification-service, worker-service |

Generate secrets:

```sh
openssl rand -base64 32    # JWT_SECRET
openssl rand -hex 24       # INTERNAL_SERVICE_SECRET
```

---

## 🌐 Where to Get API Keys

| Variable | Where | Free Tier |
|----------|-------|-----------|
| `DATABASE_URL` | [neon.tech](https://neon.tech) | Yes |
| `JWT_SECRET` | `openssl rand -base64 32` | — |
| `GOOGLE_CLIENT_ID/SECRET` | [console.cloud.google.com](https://console.cloud.google.com) | Yes |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) | Yes |
| `BREVO_API_KEY` | [brevo.com/settings/keys/api](https://app.brevo.com/settings/keys/api) | 300 emails/day |
| `ARCJET_KEY` | [app.arcjet.com](https://app.arcjet.com) | Yes |
| Inngest (production) | [inngest.com](https://www.inngest.com) | Dev server free locally |

---

## 🗄 Database

WiseWallet uses **Neon PostgreSQL** with **Prisma ORM**.

### Commands

```sh
npm run db:generate       # Generate Prisma client after schema changes
npm run db:push           # Push schema to DB (dev)
npm run db:migrate        # Create migration (dev)
npm run db:migrate:deploy # Apply migrations (production)
npm run db:studio         # Open Prisma Studio GUI (:5555)
npm run db:seed           # Seed test transactions (optional)
```

### Schema Overview

| Model | Table | Purpose |
|-------|-------|---------|
| `User` | `users` | Account, profile, dashboard widget prefs |
| `UserSession` | `user_sessions` | Refresh token sessions |
| `Account` | `accounts` | Bank accounts (Current/Savings) |
| `Transaction` | `transactions` | Income/expense records |
| `Budget` | `budgets` | Monthly spending limit |
| `CategoryBudget` | `category_budgets` | Per-category limits |
| `SavingsGoal` | `savings_goals` | Savings targets |
| `CategoryRule` | `category_rules` | Auto-categorization patterns |
| `EmailLog` | `email_logs` | Sent email history |
| `SplitGroup` | `split_groups` | Expense split groups |
| `SplitMember` | `split_members` | Group members |
| `SplitExpense` | `split_expenses` | Shared expenses |
| `SplitShare` | `split_shares` | Per-member share amounts |
| `SplitSettlement` | `split_settlements` | Recorded payments |
| `PasswordResetToken` | `password_reset_tokens` | Password reset flow |

---

## 🔀 API Gateway & Routing

All frontend requests go to `/api/*` which Next.js rewrites to `http://localhost:8080/api/*`.

```mermaid
flowchart LR
    FE["Frontend<br/>/api/*"] --> GW["Gateway :8080"]

    GW -->|"/api/auth/*"| S1["auth :4001"]
    GW -->|"/api/accounts/*"| S2["account :4002"]
    GW -->|"/api/transactions/*"| S3["transaction :4003"]
    GW -->|"/api/splits/*"| S3
    GW -->|"/api/budgets/*"| S4["budget :4004"]
    GW -->|"/api/notifications/*"| S5["notification :4005"]
    GW -->|"/api/inngest/*"| S6["worker :4006"]

    style GW fill:#f97316,color:#fff
```

| Gateway Path | Target Service | Notes |
|--------------|----------------|-------|
| `/api/auth/*` | auth-service :4001 | Public auth routes |
| `/api/accounts/*` | account-service :4002 | JWT required |
| `/api/transactions/*` | transaction-service :4003 | JWT required |
| `/api/splits/*` | transaction-service :4003/splits/* | JWT except public preview |
| `/api/seed/*` | transaction-service :4003/seed/* | JWT required |
| `/api/budgets/*` | budget-service :4004 | JWT required |
| `/api/notifications/*` | notification-service :4005 | JWT / internal |
| `/api/inngest/*` | worker-service :4006 | Inngest webhook |
| `/health` | Gateway | All services health check |

**Important:** Gateway does **not** use `express.json()` — bodies stream directly to services so multipart uploads (receipt scan) work correctly.

**Splits routing:** `/api/splits` is mounted with a path rewrite so `POST /api/splits` correctly hits `POST /splits` on transaction-service (not the root transaction create endpoint).

---

## 📡 API Reference

All paths below are relative to the gateway: `http://localhost:8080/api`.

🔓 = Public &nbsp;|&nbsp; 🔒 = JWT required &nbsp;|&nbsp; 🔐 = Internal key only

### Auth Service (`/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | 🔓 | Service health |
| POST | `/register` | 🔓 | Email registration |
| POST | `/login` | 🔓 | Email login → tokens |
| POST | `/refresh` | 🔓 | Refresh access token |
| POST | `/logout` | 🔓 | Revoke refresh token |
| POST | `/logout-all` | 🔒 | Revoke all sessions |
| POST | `/session` | 🔒 | Create session record |
| GET | `/sessions` | 🔒 | List active sessions |
| DELETE | `/sessions/:id` | 🔒 | Revoke one session |
| POST | `/forgot-password` | 🔓 | Send reset email |
| POST | `/reset-password` | 🔓 | Reset with token |
| GET | `/google` | 🔓 | Start Google OAuth |
| GET | `/google/callback` | 🔓 | OAuth callback → redirect with token |
| GET | `/me` | 🔒 | Current user profile |
| PATCH | `/me` | 🔒 | Update profile / dashboard widgets |
| POST | `/verify` | 🔓 | Verify JWT (internal) |

### Account Service (`/accounts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | 🔒 | List user accounts |
| POST | `/` | 🔒 | Create account (rate limited) |
| GET | `/:id` | 🔒 | Get account + transaction count |
| PATCH | `/:id` | 🔒 | Update name/type |
| PATCH | `/:id/default` | 🔒 | Set as default account |
| DELETE | `/:id` | 🔒 | Delete (optional `migrateToAccountId`) |

### Transaction Service (`/transactions`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | 🔒 | List transactions (filters: accountId, category, type, search, dates, amounts) |
| POST | `/` | 🔒 | Create transaction (rate limited) |
| GET | `/:id` | 🔒 | Get single transaction |
| PUT | `/:id` | 🔒 | Update transaction |
| DELETE | `/:id` | 🔒 | Delete transaction |
| DELETE | `/bulk` | 🔒 | Bulk delete by IDs |
| POST | `/scan-receipt` | 🔒 | AI receipt scan (multipart, rate limited) |
| POST | `/import/csv/preview` | 🔒 | Preview CSV import |
| POST | `/import/csv` | 🔒 | Import CSV transactions |
| GET | `/export/csv` | 🔒 | Download CSV export |
| GET | `/export/pdf` | 🔒 | Download PDF report |
| GET | `/recurring` | 🔒 | List recurring bills |
| POST | `/recurring` | 🔒 | Create recurring bill |
| PATCH | `/recurring/:id` | 🔒 | Update recurring bill |
| DELETE | `/recurring/:id` | 🔒 | Cancel recurring bill |
| GET | `/analytics/monthly` | 🔒 | Monthly income/expense trend |
| GET | `/analytics/overview` | 🔒 | Net worth overview |
| GET | `/analytics/net-worth-timeline` | 🔒 | Timeline data |
| GET | `/analytics/health-score` | 🔒 | Financial health score |
| GET | `/analytics/categories` | 🔒 | Category breakdown |
| GET | `/subscriptions` | 🔒 | Detected subscriptions |
| GET | `/insights/monthly` | 🔒 | AI monthly insights |
| POST | `/insights/ask` | 🔒 | AI finance coach Q&A |
| GET | `/rules/categories` | 🔒 | List category rules |
| POST | `/rules/categories` | 🔒 | Create category rule |
| DELETE | `/rules/categories/:id` | 🔒 | Delete category rule |
| POST | `/seed` | 🔒 | Seed demo data |

### Split Expenses (`/splits`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/splits/public/:token` | 🔓 | Public group preview (no auth) |
| GET | `/splits` | 🔒 | List user's split groups |
| POST | `/splits` | 🔒 | Create group `{ title, members? }` |
| GET | `/splits/:id` | 🔒 | Get group details |
| DELETE | `/splits/:id` | 🔒 | Delete group (owner only) |
| POST | `/splits/join/:token` | 🔒 | Join group via invite token |
| POST | `/splits/:id/members` | 🔒 | Add member by name |
| POST | `/splits/:id/expenses` | 🔒 | Add expense with shares |
| DELETE | `/splits/:groupId/expenses/:expenseId` | 🔒 | Delete expense |
| POST | `/splits/:id/settlements` | 🔒 | Record settlement payment |
| DELETE | `/splits/:groupId/settlements/:id` | 🔒 | Delete settlement |

### Budget Service (`/budgets`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | 🔒 | Get budget + current expenses (`?accountId=`) |
| PUT | `/` | 🔒 | Set/update monthly budget amount |
| GET | `/categories` | 🔒 | List category budgets |
| PUT | `/categories` | 🔒 | Upsert category budget |
| DELETE | `/categories/:category` | 🔒 | Delete category budget |
| GET | `/goals` | 🔒 | List savings goals |
| POST | `/goals` | 🔒 | Create savings goal |
| PUT | `/goals/:id` | 🔒 | Update savings goal |
| DELETE | `/goals/:id` | 🔒 | Delete savings goal |

### Notification Service (`/notifications`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/send` | 🔐 | Send email (worker internal) |
| GET | `/emails` | 🔒 | Email history for user |
| POST | `/test` | 🔒 | Send test email to self |

---

## 🖥 Frontend Routes & Pages

| Route | Protected | Description |
|-------|-----------|-------------|
| `/` | No | Landing page with features, testimonials, FAQ |
| `/sign-in` | No | Login / register (email + Google) |
| `/reset-password` | No | Password reset form |
| `/auth/callback` | No | OAuth token storage + redirect |
| `/dashboard` | Yes | Main dashboard with widgets |
| `/account/[id]` | Yes | Account detail + transaction table |
| `/transaction/create` | Yes | Add/edit transaction + receipt scan |
| `/reports` | Yes | Charts, filters, PDF export |
| `/settings` | Yes | Profile, sessions, widgets, category rules |
| `/subscriptions` | Yes | Recurring bills management |
| `/splits` | Yes | Split expense groups |
| `/split/[token]` | No* | Public invite page (*join requires login) |

**Middleware** (`frontend/middleware.js`) protects routes by checking `auth_token` cookie. Unauthenticated users redirect to `/sign-in`.

---

## 🔒 Authentication & Sessions

### Login Flow (Google OAuth)

1. User clicks "Continue with Google"
2. Browser → GET /api/auth/google
3. Gateway → auth-service → redirect to Google
4. Google callback → GET /api/auth/google/callback
5. auth-service creates/updates User in Neon
6. Issues JWT (1h) + refresh token (30d)
7. Redirect → /auth/callback?token=...&refreshToken=...
8. Frontend stores tokens in localStorage + cookie
9. Redirect → /dashboard (or `?redirect=` path for split invites)

### Login Flow (Email + Password)

```
POST /api/auth/login { email, password }
→ { token, refreshToken, user }
→ stored client-side → redirect to dashboard
```

### Token Refresh

When any API call returns `401`, `frontend/lib/api.js` automatically:

1. Calls `POST /api/auth/refresh` with refresh token
2. Gets new access + refresh tokens
3. Retries the original request
4. If refresh fails → clear tokens → redirect to `/sign-in`

### Session Management

- Each login creates a `UserSession` row with refresh token hash
- Settings page shows all sessions with user-agent
- Revoke individual session or logout all devices

---

## 🤝 Split Expenses (Splitwise-style)

### How It Works

1. **Create group** — only a name is required (e.g. "Goa Trip", "Flatmates")
2. **Get invite link** — automatically copied: `https://yourapp.com/split/{inviteToken}`
3. **Share link** — WhatsApp, copy, or native share sheet
4. **Friends join** — open link → sign in → join group (no bank account needed)
5. **Add expenses** — who paid + amount → split equally among members
6. **Settle up** — see who owes whom; record when someone pays back

### Key Design Decisions

- Split expenses are **completely separate** from bank transactions
- No `accountId` required for splits — friends without WiseWallet accounts can join via link
- Owner is auto-added as first member on group creation
- Members can be added by name/email at creation or join later via link
- Settlements reduce calculated balances between members

### API Example — Create Group

```sh
curl -X POST http://localhost:8080/api/splits \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"title":"Goa Trip","members":["rahul@email.com","Priya"]}'
```

Response:

```json
{
  "group": {
    "id": "...",
    "title": "Goa Trip",
    "inviteToken": "f8dc67ba-596e-4655-aa9e-237d776f703a",
    "members": [...],
    "settlementsSuggested": []
  }
}
```

---

## ⏰ Background Jobs (Inngest)

`npm run dev` starts the **Inngest Dev Server** on port **8288** alongside all services.

Dashboard: **http://localhost:8288**

```mermaid
flowchart TB
    ING[Inngest Dev Server :8288]

    ING -->|daily midnight| R1[trigger-recurring-transactions]
    R1 --> R2[process-recurring-transaction]

    ING -->|every 6h| B1[check-budget-alerts]
    ING -->|every 6h| B2[check-category-budget-alerts]

    ING -->|daily 9 AM| BR[send-bill-reminders]
    ING -->|Monday 9 AM| WD[send-weekly-digests]
    ING -->|1st of month| MR[generate-monthly-reports]

    B1 & B2 & BR & WD & MR --> NOTIF[notification-service]
    MR --> GQ[Groq AI insights]

    style ING fill:#000,color:#fff
    style NOTIF fill:#f97316,color:#fff
```

### Functions

| # | Function ID | Trigger | Description |
|---|-------------|---------|-------------|
| 1 | `process-recurring-transaction` | Event: `transaction/recurring.process` | Process one recurring bill |
| 2 | `trigger-recurring-transactions` | Cron: `0 0 * * *` (daily midnight) | Find due bills → dispatch events |
| 3 | `generate-monthly-reports` | Cron: `0 0 1 * *` (1st of month) | AI monthly report email to all users |
| 4 | `check-budget-alerts` | Cron: every 6h + event `budget/alert.check` | Email when 80%+ budget used |
| 5 | `check-category-budget-alerts` | Cron: every 6h + event `budget/category-alert.check` | Category budget warnings |
| 6 | `send-bill-reminders` | Cron: daily 9 AM + event `bill/reminder.check` | Remind before bill due date |
| 7 | `send-weekly-digests` | Cron: Monday 9 AM + event `digest/weekly.send` | Weekly spending summary |

### Manual Testing

1. Open http://localhost:8288
2. Click any function → **Invoke**
3. For bill reminders in dev, use payload: `{ "force": true, "daysAhead": 30 }`

### Production Inngest

Add to `server/worker-service/.env`:

```env
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

Register app URL: `https://your-api.com/api/inngest`

---

## 📧 Email System

Emails are sent via **Brevo** through the notification-service.

```mermaid
sequenceDiagram
    participant ING as Inngest Worker
    participant WRK as worker-service
    participant NOTIF as notification-service
    participant BR as Brevo API
    participant DB as email_logs

    ING->>WRK: Cron trigger (budget alert)
    WRK->>WRK: Query users over 80% budget
    WRK->>NOTIF: POST /send + x-internal-key
    NOTIF->>BR: Send transactional email
    BR-->>NOTIF: Message ID
    NOTIF->>DB: Log email status
    NOTIF-->>WRK: OK
```

### Email Types

| Type | Subject Example |
|------|-----------------|
| `test` | WiseWallet Test Email |
| `budget-alert` | ⚠️ Budget Alert — 85% used on HDFC |
| `category-budget-alert` | ⚠️ Food budget at 90% |
| `bill-reminder` | Bill due: Netflix — ₹649 in 2 days |
| `weekly-digest` | Your week: ₹12,400 spent |
| `monthly-report` | Your Monthly Financial Report - January |

### CLI Testing

```sh
npm run email:test
npm run email:budget-alert
```

**Important:** `EMAIL_FROM` address must be **verified** in Brevo dashboard (Senders & Domains).

---

## 🛡 Security (ArcJet, JWT, Rate Limits)

```mermaid
flowchart TD
    REQ[Incoming Request] --> GW{API Gateway}
    GW --> SHIELD[ArcJet Shield<br/>SQL injection · suspicious patterns]
    SHIELD --> BOT[Bot Detection<br/>block bad bots]
    BOT --> PROXY[Proxy to service]

    PROXY --> JWT{JWT Valid?}
    JWT -->|No| R401[401 Unauthorized]
    JWT -->|Yes| RL{Rate Limit?}
    RL -->|Exceeded| R429[429 Too Many Requests]
    RL -->|OK| HANDLER[Service Handler]

    style SHIELD fill:#ef4444,color:#fff
    style BOT fill:#f97316,color:#fff
    style HANDLER fill:#22c55e,color:#fff
```

### ArcJet Layers

| Layer | Where | Protection |
|-------|-------|------------|
| Gateway Shield | api-gateway | SQL injection, suspicious requests |
| Bot Detection | api-gateway | Block bad bots (allow search engines, Inngest) |
| User Rate Limit | account-service | 10 account creates / hour / user |
| User Rate Limit | transaction-service | 10 transactions / hour / user |
| AI Rate Limit | transaction-service | 5 receipt scans / hour / user |

### JWT

- Access token: **1 hour** expiry
- Refresh token: **30 days**, stored hashed in `user_sessions`
- `JWT_SECRET` must be identical across all verifying services

### Internal Service Auth

Worker → Notification uses `x-internal-key: INTERNAL_SERVICE_SECRET` header. Never expose this to the frontend.

### Frontend Security

- Protected routes via Next.js middleware (cookie check)
- Tokens in `localStorage` + `auth_token` httpOnly-style cookie
- Auto logout on expired refresh token
- CORS restricted to `WEB_URL` on gateway

---

## 📱 PWA & Offline

- **Manifest:** `frontend/public/manifest.json`
- **Service Worker:** registered via `PwaRegister` component
- **Installable:** Add to home screen on mobile
- **Theme color:** Orange `#f97316`

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install all workspace dependencies |
| `npm run setup:env` | Copy all `.env.example` → `.env` |
| `npm run dev` | Start all 9 processes (services + frontend + Inngest) |
| `npm run dev:clean` | Clear caches then start dev |
| `npm run clean` | Clear Next.js / webpack / turbo caches only |
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

### What `npm run dev` Starts

| Process | Port | Package |
|---------|------|---------|
| frontend | 3000 | `@wisewallet/frontend` |
| api-gateway | 8080 | `@wisewallet/api-gateway` |
| auth-service | 4001 | `@wisewallet/auth-service` |
| account-service | 4002 | `@wisewallet/account-service` |
| transaction-service | 4003 | `@wisewallet/transaction-service` |
| budget-service | 4004 | `@wisewallet/budget-service` |
| notification-service | 4005 | `@wisewallet/notification-service` |
| worker-service | 4006 | `@wisewallet/worker-service` |
| inngest dev | 8288 | inngest-cli |

Port constants defined in `packages/shared/src/index.js` → `SERVICE_PORTS`.

---

## 🌍 URLs When Running

| URL | Description |
|-----|-------------|
| http://localhost:3000 | **Main app** — open in browser |
| http://localhost:3000/sign-in | Login / register |
| http://localhost:3000/dashboard | Dashboard (after login) |
| http://localhost:3000/splits | Split expense groups |
| http://localhost:3000/split/{token} | Public split invite link |
| http://localhost:8080/health | Gateway + all services health |
| http://localhost:8288 | Inngest dashboard (background jobs) |
| http://localhost:5555 | Prisma Studio (`npm run db:studio`) |

---

## 🧪 Testing Features

### Login

1. Open http://localhost:3000
2. **Continue with Google** or register with email/password

### Bank Account & Transaction

1. Dashboard → **Add New Account** (HDFC, Cash, etc.)
2. Header → **Add Transaction**
3. Upload receipt photo → AI auto-fills amount & category

### Split Expenses

1. Profile menu → **Split Expenses** (or `/splits`)
2. **Create group & get link**
3. Share link on WhatsApp
4. Friend opens link → signs in → joins group
5. Add expense → see who owes whom → **Settle up**

### Budget & Alerts

1. Dashboard → edit monthly budget
2. Settings → category budgets
3. Trigger alert manually in Inngest: `check-budget-alerts` with `{ "force": true }`

### Email

1. Dashboard → **Email Notifications** → Send Test Email
2. Check inbox + email history in dashboard

### Inngest Jobs

1. Open http://localhost:8288
2. All 7 functions listed
3. Click function → **Invoke** to test manually

### ArcJet Rate Limit

Create 10+ accounts or transactions within 1 hour → expect `429 Too Many Requests`.

### Health Check

```sh
curl http://localhost:8080/health
```

All services should return `"status": "ok"`.

---

## 🔧 Troubleshooting

### Port already in use

```sh
lsof -i :3000
kill -9 <PID>
```

Or change ports in `packages/shared/src/index.js`.

### Stale UI / old code showing

```sh
npm run dev:clean
# Then hard refresh: Cmd+Shift+R
```

### Google login redirect error

- Redirect URI must be exactly: `http://localhost:8080/api/auth/google/callback`
- `GOOGLE_CALLBACK_URL` in auth-service `.env` must match
- `WEB_URL=http://localhost:3000`

### Database connection failed

- Verify `DATABASE_URL` in all service `.env` files
- Neon project must be active (not paused)
- URL must include `?sslmode=require`

### 401 Unauthorized

- Login again — JWT may have expired
- `JWT_SECRET` must be **identical** in auth, account, transaction, budget, notification

### "Please select a bank account" on splits

This was a gateway routing bug (fixed). Ensure `api-gateway/src/index.js` rewrites `/api/splits` → `/splits` on transaction-service. Restart dev server after pulling latest code.

### Emails not sending

- Verify sender in Brevo dashboard (Senders & Domains)
- Check `BREVO_API_KEY` and `EMAIL_FROM`
- Check dashboard Email Notifications for failed status

### ArcJet blocking requests

- Set `ARCJET_KEY` in gateway, account-service, transaction-service
- Console should show: `[api-gateway] ArcJet shield + bot detection enabled`
- curl requests may be blocked — use browser or add User-Agent header

### Inngest functions not showing

- Ensure `npm run dev` is running (includes Inngest)
- Worker service must be up on :4006
- Open http://localhost:8288 manually

---

## 🚢 Production Deployment Notes

WiseWallet is currently optimized for **local development**. For production:

```mermaid
flowchart LR
    subgraph Vercel["Vercel"]
        FE[Next.js Frontend]
    end

    subgraph Backend["Railway / Render / Fly.io"]
        GW[API Gateway]
        SVC[Microservices x6]
    end

    subgraph Cloud["Managed Services"]
        NEON[(Neon PostgreSQL)]
        ING[Inngest Cloud]
        BR[Brevo]
        GQ[Groq]
    end

    FE --> GW --> SVC --> NEON
    SVC --> ING & BR & GQ

    style FE fill:#000,color:#fff
    style GW fill:#f97316,color:#fff
```

### Frontend

- Deploy to **Vercel** or similar
- Set `API_GATEWAY_URL` to production gateway URL
- Set `NEXT_PUBLIC_APP_URL` to production domain
- Run `npm run build`

### Backend Services

Each microservice needs its own deployment (Railway, Render, Fly.io, etc.):

- Update `WEB_URL` and `GOOGLE_CALLBACK_URL` to production URLs
- Set production `DATABASE_URL` (Neon production branch)
- Configure Inngest production keys
- Use `npm run db:migrate:deploy` for schema

### Split Invite Links

Invite URLs use `window.location.origin`. In production, ensure users access the app via your real domain so links share correctly.

### Google OAuth Production

Add production URLs to Google Cloud Console:

```
Authorized origins: https://yourdomain.com, https://api.yourdomain.com
Redirect URI: https://api.yourdomain.com/api/auth/google/callback
```

### Security Checklist

- [ ] Strong unique `JWT_SECRET` per environment
- [ ] `INTERNAL_SERVICE_SECRET` never exposed to client
- [ ] ArcJet enabled on gateway + mutation services
- [ ] CORS `WEB_URL` set to production domain only
- [ ] Neon connection pooling enabled for serverless
- [ ] Brevo sender domain verified

---

## 🗺 Roadmap & Known Limitations

### Planned / Optional Improvements

| Item | Status |
|------|--------|
| Custom (unequal) split per member | Not yet — equal split only |
| Delete expense in splits UI | Backend ready, UI pending |
| Group rename / leave group | Not yet |
| Split activity email notifications | Not yet |
| Docker / docker-compose | Not yet |
| Automated tests / CI | Not yet |
| Production deploy configs | Not yet |

### Current Limitations

- **INR only** — no multi-currency support
- **Split expenses** are not linked to bank transactions
- **Invite links** use localhost in dev (expected)
- **No mobile native app** — PWA only
- **No real-time sync** — page refresh needed for split updates

---

<div align="center">

## 💗 Credits

**Made with 💗 by [Shubham Malik](https://github.com/shubham-malik)**

For extended step-by-step setup with screenshots, see [`setup.md`](./setup.md).

<br/>

<!-- Footer animation -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=24&height=100&section=footer&text=WiseWallet&fontSize=42&fontAlignY=55" width="100%" alt="Footer"/>

⭐ **Star this repo if you found it useful!**

</div>

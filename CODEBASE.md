# Codebase Documentation

## 🏗️ Architecture Overview

This project is a **Hybrid Web Application** combining a Node.js/Express backend with a Next.js 16 frontend.

- **Frontend:** Next.js (App Router) located in `client/`
- **Backend:** Node.js + Express located in `src/`
- **Database:** Supabase (PostgreSQL) via Knex.js
- **Payment:** Stripe
- **Infrastructure:** Vercel (Serverless Functions for API + Edge for Frontend)

---

## 📂 Directory Structure

```plaintext
/
├── .agent/                 # Antigravity Kit (AI Rules & Scripts)
├── api/                    # Vercel Serverless Entrypoint
├── client/                 # Next.js Frontend Application
│   ├── src/app/            # App Router Pages (login, play, subscription)
│   ├── src/components/     # React Components (UI, sections)
│   └── public/             # Frontend-specific static assets
├── public/                 # Shared static assets (Games, Legacy images)
├── src/                    # Backend API Source Code
│   ├── routes/             # Express Routes (auth, user, game, payment)
│   ├── models/             # Database Models/Helpers
│   ├── database.js         # Knex Connection
│   └── server.js           # Express App Entrypoint
├── migrations/             # Database Migrations (Knex)
└── vercel.json             # Deployment Configuration
```

---

## 🛠️ Technology Stack

### Backend
- **Framework:** Express.js
- **Database:** PostgreSQL (Supabase)
- **ORM/Query Builder:** Knex.js
- **Auth:** Passport.js (Google OAuth), Sessions (pg-connect-simple)
- **Payments:** Stripe SDK

### Frontend
- **Framework:** Next.js 16
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** Lucide React, Framer Motion
- **Architecture:** App Router

---

## 🔑 Key Dependencies & Services

- **Stripe:** Used for "Monthly" (Subscription) and "Annual/Semiannual" (One-time) payments.
- **Supabase:** Hosts the PostgreSQL database.
- **Vercel:** Hosts the application. `vercel.json` routes `/api/*` to the backend and everything else to Next.js.

---

## 📝 Environment Variables

Required in Vercel Project Settings:

```ini
# Database
DATABASE_URL=postgres://user:pass@host:port/dbname

# Stripe
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Auth & Session
SESSION_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# App
NODE_ENV=production
DOMAIN=https://seu-app.vercel.app
```

---

## 📜 Database Schema (Core Tables)

- **users**: Stores user profile, auth data, and subscription status (`subscription_type`, `subscription_end_date`).
- **game_plays**: logs user activity (game played, duration).
- **session**: Stores express-sessions in Postgres.

---

## 🔄 Workflows

- **Deployment:** Git Push → Vercel Build.
- **Migrations:** Manual trigger via `/api/admin/migrate-db` (Emergency) or typically during build (if configured).

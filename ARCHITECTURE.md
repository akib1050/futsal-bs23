# Futsal BS23 — Project Architecture

Context document for the whole system: stack, backend design, frontend structure, data model, auth, payments, and deployment.

**Live:** [https://futsal-bs23.vercel.app](https://futsal-bs23.vercel.app)  
**Repo:** [https://github.com/akib1050/futsal-bs23](https://github.com/akib1050/futsal-bs23)

---

## 1. What the product is

Biweekly futsal club app for **BS23 · Europe turf**:

- Shared **money pool** (turf cost vs collections)
- **Player accounts** with personal **credit** and match history
- **bKash** payment submission → **admin approval** → credit update
- **Team maker** that splits players into 2 rating-balanced sides

---

## 2. High-level architecture

This is a **full-stack monolith** — one Next.js app serves UI and API.

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (players / admin)            │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              Vercel  ·  Next.js 16 (App Router)             │
│  ┌─────────────────────┐    ┌────────────────────────────┐  │
│  │  Frontend (React)   │    │  Backend (Route Handlers)  │  │
│  │  src/app/* pages    │◄──►│  src/app/api/*             │  │
│  │  Client components  │    │  Zod validation            │  │
│  └─────────────────────┘    │  Auth guards               │  │
│           ▲                 └─────────────┬──────────────┘  │
│           │ proxy.ts                      │                 │
│           │ (session gate)                ▼                 │
│  ┌────────┴────────┐         ┌────────────────────────────┐ │
│  │ JWT cookie      │         │  Domain libs               │ │
│  │ jose + bcrypt   │         │  finance / teams / prisma  │ │
│  └─────────────────┘         └─────────────┬──────────────┘ │
└────────────────────────────────────────────┼────────────────┘
                                             │ Prisma Client
                                             ▼
                               ┌─────────────────────────────┐
                               │  PostgreSQL (Prisma Postgres│
                               │  / Neon-compatible)         │
                               └─────────────────────────────┘
```

There is **no separate Express/Nest backend**. Backend logic lives in:

- `src/app/api/**` — HTTP endpoints
- `src/lib/**` — auth, finance, teams, Prisma
- `src/proxy.ts` — Next.js 16 request gate (auth redirects)

---

## 3. Technology stack

### Frontend

| Layer | Choice | Version / notes |
|-------|--------|-----------------|
| Framework | **Next.js** (App Router) | `16.2.11` |
| UI library | **React** | `19.2.4` |
| Language | **TypeScript** | `^5` |
| Styling | **Tailwind CSS** | v4 (`@tailwindcss/postcss`) |
| Fonts | Google Fonts via `next/font` | Bebas Neue + DM Sans |
| Client data | `fetch` to own APIs | no Redux / React Query |

### Backend (inside the same Next.js app)

| Layer | Choice | Notes |
|-------|--------|-------|
| API style | **Next.js Route Handlers** | `src/app/api/.../route.ts` |
| ORM | **Prisma** | `5.22.0` |
| Database | **PostgreSQL** | `DATABASE_URL` |
| Validation | **Zod** | request body schemas |
| Auth session | **JWT in HTTP-only cookie** | `jose` |
| Passwords | **bcryptjs** | hashed at rest |
| Dates | `date-fns` | formatting helpers |

### Infrastructure

| Concern | Choice |
|---------|--------|
| Hosting | **Vercel** (`futsal-bs23.vercel.app`) |
| Build | `prisma generate && next build` |
| DB host | Prisma Postgres / Postgres-compatible (`db.prisma.io` or similar) |
| Optional alt | Railway config present (`railway.json`) |

---

## 4. Directory map

```
futsal/
├── prisma/
│   ├── schema.prisma      # Data model
│   └── seed.ts            # Roster history + admin users
├── src/
│   ├── app/
│   │   ├── layout.tsx     # Shell + nav + pending-approval gate
│   │   ├── page.tsx       # Pool dashboard
│   │   ├── login/         # Sign in
│   │   ├── register/      # Create player account
│   │   ├── me/            # Player credit + stats
│   │   ├── pay/           # bKash submit form
│   │   ├── admin/         # Admin portal
│   │   ├── players/       # Roster (writes = admin)
│   │   ├── sessions/      # Match log (writes = admin)
│   │   ├── teams/         # 2-team maker
│   │   ├── ledger/        # Payment ledger (writes = admin)
│   │   └── api/           # Backend HTTP API
│   ├── components/        # Nav, shared UI primitives
│   ├── lib/
│   │   ├── prisma.ts      # Singleton Prisma client
│   │   ├── auth.ts        # requireUser / requireAdmin
│   │   ├── session.ts     # JWT encrypt/decrypt + cookie
│   │   ├── finance.ts     # Pool + credit math
│   │   ├── teams.ts       # Rating-balanced split
│   │   ├── format.ts      # Taka / date helpers
│   │   └── use-auth.ts    # Client-side role helper
│   └── proxy.ts           # Next.js 16 auth redirect gate
├── scripts/               # Seed helpers, smoke tests
├── vercel.json
└── package.json
```

---

## 5. Backend system design

### 5.1 Request flow

1. Browser hits a page or `/api/...`.
2. **Pages** go through `src/proxy.ts`:
   - No session → redirect `/login`
   - Session on `/login` or `/register` → redirect `/me`
   - Non-admin on `/admin` → redirect `/me`
3. **API routes** do **not** use proxy; they call auth helpers:
   - `requireUser()` — any signed-in user
   - `requireApprovedUser()` — approved player or admin
   - `requireAdmin()` — admin only
4. Handlers validate with **Zod**, mutate via **Prisma**, return JSON.

### 5.2 Auth model

```
Register / Login
      │
      ▼
bcrypt verify / hash
      │
      ▼
JWT (jose HS256)  →  cookie: futsal_session (httpOnly, 30 days)
      │
      ▼
getCurrentUser() loads User (+ linked Player) from DB
```

**Roles**

| Role | Capabilities |
|------|----------------|
| `PLAYER` | View own card, pay via bKash, view pool/sessions/teams (read), wait for approval if not linked |
| `ADMIN` | Everything above + `/admin`, approve payments/users, create sessions/players/ledger entries |

**Approval rules**

- Claiming an existing roster player on register → `isApproved: true` immediately
- New name / no roster claim → waits for admin approve + player link
- Unapproved users see a pending screen in `layout.tsx`

### 5.3 Domain / finance design

Constants (in `src/lib/finance.ts`):

- `SLOT_RATE = 300` ৳ per session charged to a player
- Prepaid package historically = **900 ৳ → 3 slots**

**Pool remaining**

```
remaining = sum(payments where type ≠ ADJUSTMENT)
          + sum(ADJUSTMENT amounts)
          − sum(session.turfCost)
```

**Player credit**

```
totalPaid  = sum(player.payments.amount)
charged    = sessionsAttended × 300
credit     = totalPaid − charged
slotsLeft  = floor(credit / 300)   (if credit ≥ 0)
```

Negative credit = player **owes** that amount.

### 5.4 bKash payment flow

```
Player                     API                         Admin
  │                         │                            │
  │  Send Money to          │                            │
  │  01796620959 (manual)   │                            │
  │                         │                            │
  │  POST /api/payment-     │                            │
  │  requests (trxId, amt)  │                            │
  │ ───────────────────────►│  PaymentRequest PENDING    │
  │                         │                            │
  │                         │◄── PATCH approve/reject ───│
  │                         │                            │
  │                         │  On APPROVE:               │
  │                         │   create Payment row       │
  │                         │   link paymentId           │
  │                         │   credit recalculates      │
  │  My card refreshes      │                            │
  │◄────────────────────────│                            │
```

Notes:

- Duplicate `trxId` (non-rejected) is rejected with `409`
- Approve requires the account to be linked to a `Player`
- Amount ≥ 900 is typed as `PREPAID`, else `SESSION` in the ledger

### 5.5 Team maker

`POST /api/teams` with `playerIds[]`:

1. Load ratings from DB  
2. Greedy draft into Team A / Team B  
3. Swap pass to reduce average-rating gap  
4. Return `{ teamA, teamB, avgA, avgB, diff }`

---

## 6. Data model (PostgreSQL via Prisma)

```
User 1──0..1 Player
User 1──* PaymentRequest (as requester)
User 1──* PaymentRequest (as reviewer)

Player 1──* Payment
Player 1──* SessionPlayer
Player 1──* PaymentRequest

Session 1──* SessionPlayer
Session 1──* Payment

PaymentRequest 0..1──0..1 Payment   (set when approved)
```

### Entities (summary)

| Model | Purpose |
|-------|---------|
| `User` | Login identity, role, approval, optional `playerId` |
| `Player` | Roster card: name, rating, attendance, payments |
| `Session` | One turf booking (date, `turfCost`, notes) |
| `SessionPlayer` | Attendance row (player or guest, prepaid use, cash paid) |
| `Payment` | Money ledger entry (`PREPAID` / `SESSION` / `GUEST` / `ADJUSTMENT`) |
| `PaymentRequest` | Pending bKash/cash claim (`PENDING` / `APPROVED` / `REJECTED`) |

String enums are stored as `String` fields (SQLite-era habit kept for Postgres simplicity).

---

## 7. API surface

### Auth

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/register` | public | Create account |
| POST | `/api/auth/login` | public | Sign in |
| POST | `/api/auth/logout` | session | Clear cookie |
| GET | `/api/auth/roster` | public | Unclaimed players for register |

### Player

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/me` | user | Profile + stats + own requests |
| GET/POST | `/api/payment-requests` | approved | List / submit bKash claim |

### Club data

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/summary` | approved | Pool + balances |
| GET/POST | `/api/players` | approved / **admin write** | Roster |
| PATCH/DELETE | `/api/players/[id]` | **admin** | Update / deactivate |
| GET/POST | `/api/sessions` | approved / **admin write** | Sessions |
| DELETE | `/api/sessions/[id]` | **admin** | Delete session |
| GET/POST | `/api/payments` | approved / **admin write** | Ledger |
| POST | `/api/teams` | approved | Make 2 teams |

### Admin

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/admin/payment-requests` | admin | All payment claims |
| PATCH | `/api/admin/payment-requests/[id]` | admin | Approve / reject |
| GET | `/api/admin/users` | admin | Accounts + roster |
| PATCH/DELETE | `/api/admin/users/[id]` | admin | Approve, link player, delete |

---

## 8. Frontend pages

| Route | Audience | Role |
|-------|----------|------|
| `/login`, `/register` | Public | Auth |
| `/me` | Player/Admin | Credit, history, payment CTA |
| `/pay` | Approved | bKash number + submit trx |
| `/admin` | Admin only | Approve money + accounts |
| `/` | Approved | Pool dashboard |
| `/players` | Approved | Roster (edit UI admin-only) |
| `/sessions` | Approved | Sessions (create UI admin-only) |
| `/teams` | Approved | Team maker |
| `/ledger` | Approved | Money log (write UI admin-only) |

UI pattern: server components for data-heavy pages (`/`, `/me`); client components for forms (`/pay`, `/admin`, `/sessions`).

---

## 9. Environment variables

| Variable | Used for |
|----------|----------|
| `DATABASE_URL` | Postgres connection (Prisma) |
| `SESSION_SECRET` | JWT signing key |
| `ADMIN_EMAIL` | Seeded admin email (default `akib@futsalbs23.com`) |
| `ADMIN_PASSWORD` | Seeded admin password |
| `NEXT_PUBLIC_APP_NAME` | Display name |
| `NEXT_PUBLIC_BKASH_NUMBER` | Shown on Pay page (`01796620959`) |

Seed also ensures `admin@futsalbs23.com` as a secondary admin with the same password.

---

## 10. Deployment architecture

```
GitHub (akib1050/futsal-bs23)
        │
        │  vercel --prod  (or Git-connected deploy)
        ▼
Vercel project: futsal-bs23
  • Framework: Next.js
  • Build: npm run build  →  prisma generate && next build
  • Alias: https://futsal-bs23.vercel.app
        │
        ▼
Runtime: serverless / Node on Vercel
  • Env: DATABASE_URL, SESSION_SECRET, ADMIN_*, BKASH
        │
        ▼
PostgreSQL (external)
```

Important: **`prisma db push` is not part of the Vercel build** (Vercel build network may not reach the DB). Schema is applied locally / separately with `npm run db:push` or `npm run db:setup`.

---

## 11. Security notes

- Passwords never stored plain — bcrypt hashes only
- Session cookie: `httpOnly`, `sameSite=lax`, `secure` in production
- Admin routes double-gated: `proxy.ts` (pages) + `requireAdmin()` (API)
- Payment approve is transactional: create `Payment` + mark request `APPROVED`
- Duplicate trx IDs blocked to reduce double-credit risk
- bKash is **manual Send Money** (no live bKash gateway API yet) — trust model is admin verification of trx ID

---

## 12. Local development

```bash
npm install
cp .env.example .env   # fill DATABASE_URL + SESSION_SECRET
npm run db:setup       # prisma db push + seed
npm run dev            # http://localhost:3000
```

Useful scripts:

- `npm run db:push` — sync schema
- `npm run db:seed` — admin + BS23 history (idempotent on sessions)
- `node scripts/smoke.mjs` — end-to-end auth/payment smoke test

---

## 13. Design decisions (why this shape)

1. **Monolith Next.js** — one deploy, shared types, simple for a club app  
2. **PostgreSQL + Prisma** — relational money/attendance data; easy migrations  
3. **JWT cookie auth** — no third-party auth vendor required  
4. **Manual bKash + admin approve** — matches real BD club workflow without payment gateway fees  
5. **Credit = paid − sessions×300** — simple mental model for “what I have left / what I owe”  
6. **Next.js 16 `proxy.ts`** — replaces classic `middleware.ts` in this Next version  

---

*Last updated to match the live Futsal BS23 codebase (Next 16 + Prisma 5 + Postgres + Vercel).*

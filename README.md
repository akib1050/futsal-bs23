# Futsal BS23

Biweekly futsal **cost pool**, **player ratings**, and **balanced 2-team maker** for BS23 Europe.

## Features

- **Pool dashboard** — remaining balance, turf spent, prepaid slots left
- **Players** — add roster, set ratings (1–10), add 900 ৳ prepaid packages
- **Sessions** — log turf cost (default 4050), attendees, guests, per-head or prepaid use
- **Team maker** — pick players → split into 2 rating-balanced teams
- **Ledger** — every payment / guest / adjustment

Seeded with your existing BS23 history (pool remaining ≈ **2,450 ৳**).

## Local setup

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (live)

### Option A — Railway (recommended with SQLite)

1. Push this repo to GitHub.
2. Create a new Railway project → Deploy from GitHub.
3. Add a volume mounted at `/data`.
4. Set env:
   - `DATABASE_URL=file:/data/futsal.db`
   - `PORT` is provided by Railway
5. Build command: `npm run build`
6. Start command: `npx prisma db push && npm run db:seed && npm start`  
   (run seed only once; afterwards use `npm start`)

### Option B — Vercel + Neon Postgres

1. Create a free [Neon](https://neon.tech) database.
2. In `prisma/schema.prisma`, change:
   ```prisma
   provider = "postgresql"
   ```
3. Set `DATABASE_URL` to your Neon connection string in Vercel.
4. Deploy the repo to Vercel.
5. Run once: `npx prisma db push && npm run db:seed`

## Default turf & prepaid

| Item | Amount |
|------|--------|
| Turf (Europe) | 4,050 ৳ |
| Prepaid package | 900 ৳ → 3 slots |
| Typical per-head | 300 ৳ |

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
cp .env.example .env   # set DATABASE_URL (Postgres)
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Uses **PostgreSQL** (Prisma Postgres / Neon / any Postgres).

## Deploy (live)

### Vercel (recommended)

1. Import the GitHub repo in [Vercel](https://vercel.com).
2. Set env `DATABASE_URL` to your Postgres connection string.
3. Build command: `npm run build`
4. After first deploy, run seed once locally against that DB:
   ```bash
   DATABASE_URL="your-prod-url" npm run db:setup
   ```

### Railway

1. Deploy from GitHub.
2. Add a Postgres plugin (or use external `DATABASE_URL`).
3. Build: `npm run build` · Start: `npm start`
4. Run `npm run db:setup` once against the Railway DB.

## Default turf & prepaid

| Item | Amount |
|------|--------|
| Turf (Europe) | 4,050 ৳ |
| Prepaid package | 900 ৳ → 3 slots |
| Typical per-head | 300 ৳ |

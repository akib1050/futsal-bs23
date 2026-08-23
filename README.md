# Futsal BS23

Biweekly futsal **cost pool**, **player login**, **bKash payments**, and **balanced 2-team maker** for BS23 Europe.

Live: [https://futsal-bs23.vercel.app](https://futsal-bs23.vercel.app)

## What players can do

- Register with their roster name and sign in
- See **credit** (paid − 300 ৳ per session) and match history
- Pay via **bKash Send Money** to `01796620959`, then submit the transaction ID
- Credit updates after the admin approves the payment

## What only admin can do

- Open `/admin`
- Approve or reject bKash payments
- Approve new accounts and link them to a player card
- Add sessions, ratings, and ledger entries

Admin login (from seed / env):

- Email: `akib@futsalbs23.com` or `admin@futsalbs23.com`
- Password: `Akib12345`

## Features

- **My card** — personal credit, slots left, previous sessions
- **Pay** — bKash number + transaction ID submission
- **Admin** — payment and account approvals
- **Pool / Players / Sessions / Teams / Ledger** — shared club view

Seeded with existing BS23 history (pool remaining ≈ **2,450 ৳**).

## Local setup

```bash
npm install
cp .env.example .env   # set DATABASE_URL and SESSION_SECRET
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Default turf & prepaid

| Item | Amount |
|------|--------|
| Turf (Europe) | 4,050 ৳ |
| Prepaid package | 900 ৳ → 3 slots |
| Typical per-head | 300 ৳ |
| bKash | 01796620959 |

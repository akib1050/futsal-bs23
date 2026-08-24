import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { syncTurfBookings } from "../src/lib/turf-bookings";

const prisma = new PrismaClient();

const CORE_PLAYERS = [
  { name: "Sunny", rating: 7.5 },
  { name: "Fahim", rating: 7 },
  { name: "Ratul", rating: 8 },
  { name: "Akib", rating: 7.5 },
  { name: "Faisal", rating: 6.5 },
  { name: "Sakib", rating: 7 },
  { name: "Pial", rating: 7.5 },
  { name: "Zillu", rating: 6.5 },
  { name: "Barshan", rating: 7 },
  { name: "Arittra", rating: 6.5 },
];

async function ensureAdmin() {
  const password = process.env.ADMIN_PASSWORD || "Akib12345";
  const passwordHash = await bcrypt.hash(password, 10);
  const emails = Array.from(
    new Set(
      [
        "akib@futsalbs23.com",
        process.env.ADMIN_EMAIL,
        "admin@futsalbs23.com",
      ]
        .filter(Boolean)
        .map((e) => String(e).toLowerCase().trim())
    )
  );

  const akib = await prisma.player.findFirst({
    where: { name: { equals: "Akib", mode: "insensitive" } },
  });

  for (const [index, email] of emails.entries()) {
    const linkAkib = index === 0 ? akib?.id : undefined;
    await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        role: "ADMIN",
        isApproved: true,
        name: "Akib",
        ...(linkAkib ? { playerId: linkAkib } : {}),
      },
      create: {
        email,
        name: "Akib",
        passwordHash,
        role: "ADMIN",
        isApproved: true,
        playerId: linkAkib,
      },
    });
    console.log(`Admin ready: ${email}`);
  }
}

async function main() {
  await ensureAdmin();
  await syncTurfBookings(prisma);
  console.log("Turf Nation bookings synced.");

  if ((await prisma.session.count()) > 0) {
    console.log("History already seeded — skipping match/payment history.");
    return;
  }

  await prisma.sessionPlayer.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.session.deleteMany();
  await prisma.player.deleteMany();

  const players = [];
  for (const p of CORE_PLAYERS) {
    players.push(
      await prisma.player.create({
        data: { name: p.name, rating: p.rating },
      })
    );
  }

  const byName = Object.fromEntries(players.map((p) => [p.name, p]));

  // Initial prepaid: 10 players × 900 = 9000 (3 slots each)
  for (const p of players) {
    await prisma.payment.create({
      data: {
        amount: 900,
        type: "PREPAID",
        playerId: p.id,
        note: "3-slot prepaid package",
      },
    });
  }

  // Session 1 — Europe turf (first slot of prepaid cycle)
  const s1 = await prisma.session.create({
    data: {
      date: new Date("2026-06-10"),
      turfCost: 4050,
      title: "Europe — prepaid kickoff",
      notes: "Ratul friends covered part of turf (Mehedi + Shaon + Cris)",
    },
  });

  for (const p of players) {
    await prisma.sessionPlayer.create({
      data: {
        sessionId: s1.id,
        playerId: p.id,
        isPrepaidUse: true,
        paidAmount: 0,
      },
    });
  }

  await prisma.payment.create({
    data: {
      amount: 1450,
      type: "GUEST",
      guestName: "Mehedi + Shaon + Cris",
      sessionId: s1.id,
      note: "Ratul friends — 550 + 900",
    },
  });

  // Session 2 — 24.06.26 (written as 24.08.26 in notes; treating as June)
  const s2 = await prisma.session.create({
    data: {
      date: new Date("2026-06-24"),
      turfCost: 4050,
      title: "Europe — 24 Jun",
      notes: "Ratul friends and others: 1050",
    },
  });

  for (const p of players) {
    await prisma.sessionPlayer.create({
      data: {
        sessionId: s2.id,
        playerId: p.id,
        isPrepaidUse: true,
        paidAmount: 0,
      },
    });
  }

  await prisma.payment.create({
    data: {
      amount: 1050,
      type: "GUEST",
      guestName: "Ratul friends & others",
      sessionId: s2.id,
      note: "Guest contributions 1050",
    },
  });

  // Session 3 — 08.07.26
  const s3 = await prisma.session.create({
    data: {
      date: new Date("2026-07-08"),
      turfCost: 4050,
      title: "Europe — 08 Jul",
      notes: "Others 1500; Pial & Raad topped up after",
    },
  });

  for (const p of players) {
    await prisma.sessionPlayer.create({
      data: {
        sessionId: s3.id,
        playerId: p.id,
        isPrepaidUse: true,
        paidAmount: 0,
      },
    });
  }

  await prisma.payment.create({
    data: {
      amount: 1500,
      type: "GUEST",
      guestName: "Others",
      sessionId: s3.id,
      note: "Others contribution",
    },
  });

  await prisma.payment.create({
    data: {
      amount: 900,
      type: "SESSION",
      playerId: byName.Pial.id,
      sessionId: s3.id,
      note: "Pial top-up after 08 Jul",
    },
  });

  await prisma.payment.create({
    data: {
      amount: 900,
      type: "GUEST",
      guestName: "Raad",
      sessionId: s3.id,
      note: "Raad contribution",
    },
  });

  // Session 4 — 22 Jul 2026 — pay-per-head 300 × 14
  const s4 = await prisma.session.create({
    data: {
      date: new Date("2026-07-22"),
      turfCost: 4050,
      title: "Europe — 22 Jul",
      notes: "14 players × 300 = 4200, −50 adjustment → 4150 collected",
    },
  });

  // Core roster + guests for 14 heads (seed as attendance for core; guests as names)
  for (const p of players) {
    await prisma.sessionPlayer.create({
      data: {
        sessionId: s4.id,
        playerId: p.id,
        isPrepaidUse: false,
        paidAmount: 300,
      },
    });
    await prisma.payment.create({
      data: {
        amount: 300,
        type: "SESSION",
        playerId: p.id,
        sessionId: s4.id,
        note: "Per-head 300",
      },
    });
  }

  for (const guest of ["Raad", "Mehedi", "Shaon", "Cris"]) {
    await prisma.sessionPlayer.create({
      data: {
        sessionId: s4.id,
        guestName: guest,
        isPrepaidUse: false,
        paidAmount: 300,
      },
    });
    await prisma.payment.create({
      data: {
        amount: 300,
        type: "GUEST",
        guestName: guest,
        sessionId: s4.id,
        note: "Per-head 300",
      },
    });
  }

  // −50 correction from notes, then −300 after 22 Jul
  await prisma.payment.create({
    data: {
      amount: -50,
      type: "ADJUSTMENT",
      note: "22 Jul collection correction (−50)",
      sessionId: s4.id,
    },
  });

  await prisma.payment.create({
    data: {
      amount: -300,
      type: "ADJUSTMENT",
      note: "After 22 Jul adjustment (−300)",
      sessionId: s4.id,
    },
  });

  const totalIn = await prisma.payment.aggregate({ _sum: { amount: true } });
  const turf = await prisma.session.aggregate({ _sum: { turfCost: true } });
  const remaining =
    (totalIn._sum.amount ?? 0) - (turf._sum.turfCost ?? 0);

  console.log("Seeded Futsal BS23");
  console.log(`Players: ${players.length}`);
  console.log(`Pool remaining (expected ~2450): ${remaining}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

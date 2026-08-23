import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Removes rows created by scripts/smoke.mjs so the pool math stays real. */
async function main() {
  const requests = await prisma.paymentRequest.deleteMany({
    where: { trxId: { startsWith: "TRX" } },
  });
  const payments = await prisma.payment.deleteMany({
    where: { note: { startsWith: "BKASH TRX" } },
  });
  const users = await prisma.user.deleteMany({
    where: { email: { endsWith: "@futsal.test" } },
  });

  const totals = await prisma.payment.aggregate({ _sum: { amount: true } });
  const turf = await prisma.session.aggregate({ _sum: { turfCost: true } });

  console.log(
    `Removed ${payments.count} payments, ${requests.count} requests, ${users.count} test users`
  );
  console.log(
    `Pool remaining: ${(totals._sum.amount ?? 0) - (turf._sum.turfCost ?? 0)}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

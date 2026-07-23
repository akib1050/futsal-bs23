import { prisma } from "./prisma";

export type PaymentType = "PREPAID" | "SESSION" | "GUEST" | "ADJUSTMENT";

export type PoolSummary = {
  totalIn: number;
  totalTurf: number;
  totalAdjustmentsOut: number;
  remaining: number;
  sessionCount: number;
  playerCount: number;
};

export type PlayerBalance = {
  playerId: string;
  name: string;
  rating: number;
  totalPaid: number;
  sessionsAttended: number;
  prepaidCredits: number;
  prepaidUses: number;
  prepaidRemaining: number;
  balance: number;
};

export async function getPoolSummary(): Promise<PoolSummary> {
  const [payments, sessions, players] = await Promise.all([
    prisma.payment.findMany(),
    prisma.session.findMany({ select: { turfCost: true } }),
    prisma.player.count({ where: { isActive: true } }),
  ]);

  const totalIn = payments
    .filter((p) => p.type !== "ADJUSTMENT")
    .reduce((s, p) => s + p.amount, 0);

  const adjustmentNet = payments
    .filter((p) => p.type === "ADJUSTMENT")
    .reduce((s, p) => s + p.amount, 0);

  const totalTurf = sessions.reduce((s, sess) => s + sess.turfCost, 0);
  const remaining = totalIn + adjustmentNet - totalTurf;

  return {
    totalIn,
    totalTurf,
    totalAdjustmentsOut: adjustmentNet < 0 ? Math.abs(adjustmentNet) : 0,
    remaining,
    sessionCount: sessions.length,
    playerCount: players,
  };
}

export async function getPlayerBalances(): Promise<PlayerBalance[]> {
  const players = await prisma.player.findMany({
    where: { isActive: true },
    include: {
      payments: true,
      attendance: true,
    },
    orderBy: { name: "asc" },
  });

  return players.map((player) => {
    const totalPaid = player.payments
      .filter((p) => p.type !== "ADJUSTMENT")
      .reduce((s, p) => s + p.amount, 0);
    const adjustments = player.payments
      .filter((p) => p.type === "ADJUSTMENT")
      .reduce((s, p) => s + p.amount, 0);
    const prepaidCredits = player.payments
      .filter((p) => p.type === "PREPAID")
      .reduce((s, p) => s + Math.floor(p.amount / 300), 0);
    const prepaidUses = player.attendance.filter((a) => a.isPrepaidUse).length;
    const sessionsAttended = player.attendance.length;

    return {
      playerId: player.id,
      name: player.name,
      rating: player.rating,
      totalPaid: totalPaid + adjustments,
      sessionsAttended,
      prepaidCredits,
      prepaidUses,
      prepaidRemaining: Math.max(0, prepaidCredits - prepaidUses),
      balance: totalPaid + adjustments,
    };
  });
}

export function paymentTypeLabel(type: PaymentType): string {
  switch (type) {
    case "PREPAID":
      return "Prepaid package";
    case "SESSION":
      return "Session pay";
    case "GUEST":
      return "Guest";
    case "ADJUSTMENT":
      return "Adjustment";
    default:
      return type;
  }
}

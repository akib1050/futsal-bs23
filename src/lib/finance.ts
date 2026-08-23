import { prisma } from "./prisma";

export type PaymentType = "PREPAID" | "SESSION" | "GUEST" | "ADJUSTMENT";

/** Cost charged to a player for one futsal slot. 900 tk prepaid = 3 slots. */
export const SLOT_RATE = 300;

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
  charged: number;
  credit: number;
  prepaidCredits: number;
  prepaidUses: number;
  prepaidRemaining: number;
  balance: number;
};

export type PlayerStats = {
  playerId: string;
  name: string;
  rating: number;
  totalPaid: number;
  charged: number;
  credit: number;
  slotsLeft: number;
  sessionsAttended: number;
  lastPlayed: Date | null;
  history: {
    id: string;
    date: Date;
    title: string | null;
    charge: number;
    paidAtSession: number;
    usedPrepaid: boolean;
  }[];
  payments: {
    id: string;
    amount: number;
    type: string;
    note: string | null;
    createdAt: Date;
  }[];
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
    const totalPaid = player.payments.reduce((s, p) => s + p.amount, 0);
    const prepaidCredits = player.payments
      .filter((p) => p.type === "PREPAID")
      .reduce((s, p) => s + Math.floor(p.amount / SLOT_RATE), 0);
    const prepaidUses = player.attendance.filter((a) => a.isPrepaidUse).length;
    const sessionsAttended = player.attendance.length;
    const charged = sessionsAttended * SLOT_RATE;

    return {
      playerId: player.id,
      name: player.name,
      rating: player.rating,
      totalPaid,
      sessionsAttended,
      charged,
      credit: totalPaid - charged,
      prepaidCredits,
      prepaidUses,
      prepaidRemaining: Math.max(0, prepaidCredits - prepaidUses),
      balance: totalPaid,
    };
  });
}

export async function getPlayerStats(
  playerId: string
): Promise<PlayerStats | null> {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      payments: { orderBy: { createdAt: "desc" } },
      attendance: { include: { session: true } },
    },
  });
  if (!player) return null;

  const totalPaid = player.payments.reduce((s, p) => s + p.amount, 0);
  const sessionsAttended = player.attendance.length;
  const charged = sessionsAttended * SLOT_RATE;
  const credit = totalPaid - charged;

  const history = player.attendance
    .map((a) => ({
      id: a.id,
      date: a.session.date,
      title: a.session.title,
      charge: SLOT_RATE,
      paidAtSession: a.paidAmount,
      usedPrepaid: a.isPrepaidUse,
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return {
    playerId: player.id,
    name: player.name,
    rating: player.rating,
    totalPaid,
    charged,
    credit,
    slotsLeft: Math.max(0, Math.floor(credit / SLOT_RATE)),
    sessionsAttended,
    lastPlayed: history[0]?.date ?? null,
    history,
    payments: player.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      type: p.type,
      note: p.note,
      createdAt: p.createdAt,
    })),
  };
}

export function paymentTypeLabel(type: PaymentType | string): string {
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

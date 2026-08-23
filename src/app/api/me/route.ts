import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getPlayerStats } from "@/lib/finance";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user } = auth;

  const [stats, requests] = await Promise.all([
    user.playerId ? getPlayerStats(user.playerId) : Promise.resolve(null),
    prisma.paymentRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ user, stats, requests });
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const [users, players] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isApproved: true,
        playerId: true,
        createdAt: true,
        player: { select: { id: true, name: true } },
      },
    }),
    prisma.player.findMany({
      where: { isActive: true },
      select: { id: true, name: true, user: { select: { id: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({ users, players });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getPlayerStats } from "@/lib/finance";
import { JERSEY_SIZES } from "@/lib/jersey";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user } = auth;

  const [stats, requests, player] = await Promise.all([
    user.playerId ? getPlayerStats(user.playerId) : Promise.resolve(null),
    prisma.paymentRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    user.playerId
      ? prisma.player.findUnique({
          where: { id: user.playerId },
          select: { jerseySize: true },
        })
      : Promise.resolve(null),
  ]);

  return NextResponse.json({
    user,
    stats,
    requests,
    jerseySize: player?.jerseySize ?? null,
  });
}

const patchSchema = z.object({
  jerseySize: z.enum(JERSEY_SIZES).nullable(),
});

export async function PATCH(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user } = auth;

  if (!user.playerId) {
    return NextResponse.json(
      { error: "Your account is not linked to a player card yet." },
      { status: 400 }
    );
  }

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Pick a valid jersey size." }, { status: 400 });
  }

  const player = await prisma.player.update({
    where: { id: user.playerId },
    data: { jerseySize: parsed.data.jerseySize },
    select: { id: true, name: true, jerseySize: true },
  });

  return NextResponse.json(player);
}

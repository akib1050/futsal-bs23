import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { makeBalancedTeams } from "@/lib/teams";

const schema = z.object({
  playerIds: z.array(z.string()).min(2),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const players = await prisma.player.findMany({
    where: { id: { in: parsed.data.playerIds }, isActive: true },
  });

  if (players.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 active players" },
      { status: 400 }
    );
  }

  const split = makeBalancedTeams(
    players.map((p) => ({ id: p.id, name: p.name, rating: p.rating }))
  );

  return NextResponse.json(split);
}

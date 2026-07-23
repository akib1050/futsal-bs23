import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  rating: z.number().min(1).max(10),
  notes: z.string().max(500).optional().nullable(),
});

export async function GET() {
  const players = await prisma.player.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      payments: true,
      attendance: true,
      _count: { select: { attendance: true } },
    },
  });
  return NextResponse.json(players);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const player = await prisma.player.create({ data: parsed.data });
  return NextResponse.json(player, { status: 201 });
}

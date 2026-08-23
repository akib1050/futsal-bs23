import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Roster names available to claim during registration. */
export async function GET() {
  const players = await prisma.player.findMany({
    where: { isActive: true, user: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(players);
}

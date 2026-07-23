import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      players: { include: { player: true } },
      payments: true,
    },
  });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(session);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  await prisma.payment.deleteMany({ where: { sessionId: id } });
  await prisma.sessionPlayer.deleteMany({ where: { sessionId: id } });
  await prisma.session.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

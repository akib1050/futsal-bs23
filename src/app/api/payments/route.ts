import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  amount: z.number().int(),
  type: z.enum(["PREPAID", "SESSION", "GUEST", "ADJUSTMENT"]),
  playerId: z.string().optional().nullable(),
  guestName: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export async function GET() {
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: { player: true, session: true },
  });
  return NextResponse.json(payments);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const payment = await prisma.payment.create({ data: parsed.data });
  return NextResponse.json(payment, { status: 201 });
}

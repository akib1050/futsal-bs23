import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const attendeeSchema = z.object({
  playerId: z.string().optional().nullable(),
  guestName: z.string().optional().nullable(),
  paidAmount: z.number().int().min(0).default(0),
  isPrepaidUse: z.boolean().default(false),
});

const createSchema = z.object({
  date: z.string(),
  turfCost: z.number().int().positive(),
  title: z.string().max(120).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  attendees: z.array(attendeeSchema).default([]),
});

export async function GET() {
  const sessions = await prisma.session.findMany({
    orderBy: { date: "desc" },
    include: {
      players: { include: { player: true } },
      payments: true,
    },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { date, turfCost, title, notes, attendees } = parsed.data;

  const session = await prisma.$transaction(async (tx) => {
    const created = await tx.session.create({
      data: {
        date: new Date(date),
        turfCost,
        title: title || null,
        notes: notes || null,
      },
    });

    for (const a of attendees) {
      await tx.sessionPlayer.create({
        data: {
          sessionId: created.id,
          playerId: a.playerId || null,
          guestName: a.guestName || null,
          paidAmount: a.paidAmount,
          isPrepaidUse: a.isPrepaidUse,
        },
      });

      if (a.paidAmount > 0) {
        await tx.payment.create({
          data: {
            amount: a.paidAmount,
            type: a.playerId ? "SESSION" : "GUEST",
            playerId: a.playerId || null,
            guestName: a.guestName || null,
            sessionId: created.id,
            note: a.isPrepaidUse ? "Prepaid slot use (cash 0)" : "Session contribution",
          },
        });
      }
    }

    return tx.session.findUnique({
      where: { id: created.id },
      include: {
        players: { include: { player: true } },
        payments: true,
      },
    });
  });

  return NextResponse.json(session, { status: 201 });
}

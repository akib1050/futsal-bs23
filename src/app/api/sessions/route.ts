import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, requireApprovedUser } from "@/lib/auth";
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
  const auth = await requireApprovedUser();
  if (!auth.ok) return auth.response;

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
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid session data. Check slot, turf cost, and attendees." },
        { status: 400 }
      );
    }

    const { date, turfCost, title, notes, attendees } = parsed.data;
    const parsedDate = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid session date." }, { status: 400 });
    }

    // One nested write avoids long interactive transactions timing out
    // when logging a full roster + guests (common 12–16 attendees).
    const session = await prisma.session.create({
      data: {
        date: parsedDate,
        turfCost,
        title: title || null,
        notes: notes || null,
        players: {
          create: attendees.map((a) => ({
            playerId: a.playerId || null,
            guestName: a.guestName || null,
            paidAmount: a.paidAmount,
            isPrepaidUse: a.isPrepaidUse,
          })),
        },
        payments: {
          create: attendees
            .filter((a) => a.paidAmount > 0)
            .map((a) => ({
              amount: a.paidAmount,
              type: a.playerId ? "SESSION" : "GUEST",
              playerId: a.playerId || null,
              guestName: a.guestName || null,
              note: a.isPrepaidUse
                ? "Prepaid slot use (cash 0)"
                : "Session contribution",
            })),
        },
      },
      include: {
        players: { include: { player: true } },
        payments: true,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    console.error("POST /api/sessions failed:", err);
    const message =
      err instanceof Error && /timed out|timeout|P1001|P1017/i.test(err.message)
        ? "Database timed out while saving. Try again in a moment."
        : "Could not save session. Try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

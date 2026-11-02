import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, requireApprovedUser } from "@/lib/auth";
import { SLOT_RATE } from "@/lib/finance";
import { JERSEY_SIZES } from "@/lib/jersey";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  rating: z.number().min(1).max(10).optional(),
  notes: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
  jerseySize: z.enum(JERSEY_SIZES).nullable().optional(),
  /** Admin sets the player's current credit; stored as an ADJUSTMENT delta. */
  credit: z.number().int().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireApprovedUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const player = await prisma.player.findUnique({
    where: { id },
    include: { payments: true, attendance: { include: { session: true } } },
  });
  if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(player);
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid player update" }, { status: 400 });
  }

  const { credit, ...playerData } = parsed.data;

  try {
    const player = await prisma.$transaction(async (tx) => {
      const existing = await tx.player.findUnique({
        where: { id },
        include: { payments: true, attendance: true },
      });
      if (!existing) {
        throw new Error("PLAYER_NOT_FOUND");
      }

      if (Object.keys(playerData).length > 0) {
        await tx.player.update({
          where: { id },
          data: playerData,
        });
      }

      if (typeof credit === "number") {
        const totalPaid = existing.payments.reduce((s, p) => s + p.amount, 0);
        const charged = existing.attendance.length * SLOT_RATE;
        const currentCredit = totalPaid - charged;
        const delta = Math.round(credit) - currentCredit;
        if (delta !== 0) {
          await tx.payment.create({
            data: {
              amount: delta,
              type: "ADJUSTMENT",
              playerId: id,
              note: `Admin set current credit to ${credit}`,
            },
          });
        }
      }

      return tx.player.findUnique({
        where: { id },
        include: {
          payments: true,
          _count: { select: { attendance: true } },
        },
      });
    });

    return NextResponse.json(player);
  } catch (err) {
    if (err instanceof Error && err.message === "PLAYER_NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("PATCH /api/players/[id] failed:", err);
    return NextResponse.json({ error: "Could not update player" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  await prisma.player.update({
    where: { id },
    data: { isActive: false },
  });
  return NextResponse.json({ ok: true });
}

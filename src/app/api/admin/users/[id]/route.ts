import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  isApproved: z.boolean().optional(),
  playerId: z.string().nullable().optional(),
  newPlayerName: z.string().min(2).max(60).optional(),
  role: z.enum(["PLAYER", "ADMIN"]).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const { isApproved, playerId, newPlayerName, role } = parsed.data;

  if (playerId) {
    const taken = await prisma.user.findFirst({
      where: { playerId, id: { not: id } },
    });
    if (taken) {
      return NextResponse.json(
        { error: "That player is already linked to another account." },
        { status: 409 }
      );
    }
  }

  const user = await prisma.$transaction(async (tx) => {
    let linkedPlayerId = playerId;

    if (newPlayerName) {
      const created = await tx.player.create({
        data: { name: newPlayerName },
      });
      linkedPlayerId = created.id;
    }

    return tx.user.update({
      where: { id },
      data: {
        ...(isApproved === undefined ? {} : { isApproved }),
        ...(role === undefined ? {} : { role }),
        ...(linkedPlayerId === undefined ? {} : { playerId: linkedPlayerId }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true,
        playerId: true,
      },
    });
  });

  return NextResponse.json(user);
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (id === auth.user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own admin account." },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

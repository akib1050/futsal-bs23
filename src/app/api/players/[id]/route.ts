import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, requireApprovedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  rating: z.number().min(1).max(10).optional(),
  notes: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
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
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const player = await prisma.player.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(player);
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

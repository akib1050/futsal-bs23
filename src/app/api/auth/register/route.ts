import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionCookie } from "@/lib/session";

const schema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(6).max(72),
  phone: z.string().max(20).optional().nullable(),
  playerId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check your name, email and password (min 6 characters)." },
      { status: 400 }
    );
  }

  const { name, password, phone, playerId } = parsed.data;
  const email = parsed.data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  let claimedName = name;
  if (playerId) {
    const taken = await prisma.user.findFirst({ where: { playerId } });
    if (taken) {
      return NextResponse.json(
        { error: "That player is already claimed by another account." },
        { status: 409 }
      );
    }
    const roster = await prisma.player.findUnique({ where: { id: playerId } });
    if (!roster || !roster.isActive) {
      return NextResponse.json(
        { error: "That player is not on the roster." },
        { status: 400 }
      );
    }
    claimedName = roster.name;
  }

  const user = await prisma.user.create({
    data: {
      name: claimedName,
      email,
      phone: phone || null,
      passwordHash: await bcrypt.hash(password, 10),
      playerId: playerId || null,
      role: "PLAYER",
      isApproved: Boolean(playerId),
    },
  });

  await createSessionCookie({
    userId: user.id,
    role: "PLAYER",
    name: user.name,
  });

  return NextResponse.json({ ok: true, pendingApproval: true }, { status: 201 });
}

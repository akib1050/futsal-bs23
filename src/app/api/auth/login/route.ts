import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionCookie } from "@/lib/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter your email and password." },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  const valid =
    user && (await bcrypt.compare(parsed.data.password, user.passwordHash));

  if (!user || !valid) {
    return NextResponse.json(
      { error: "Wrong email or password." },
      { status: 401 }
    );
  }

  await createSessionCookie({
    userId: user.id,
    role: user.role === "ADMIN" ? "ADMIN" : "PLAYER",
    name: user.name,
  });

  return NextResponse.json({
    ok: true,
    role: user.role,
    isApproved: user.isApproved,
  });
}

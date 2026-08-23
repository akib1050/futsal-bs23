import { NextResponse } from "next/server";
import { cache } from "react";
import { prisma } from "./prisma";
import { readSession } from "./session";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "PLAYER" | "ADMIN";
  isApproved: boolean;
  playerId: string | null;
  playerName: string | null;
};

export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const session = await readSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { player: { select: { name: true } } },
  });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role === "ADMIN" ? "ADMIN" : "PLAYER",
    isApproved: user.isApproved,
    playerId: user.playerId,
    playerName: user.player?.name ?? null,
  };
});

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === "ADMIN";
}

type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; response: NextResponse };

/** Any signed-in account, approved or not. */
export async function requireUser(): Promise<AuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Sign in required" }, { status: 401 }),
    };
  }
  return { ok: true, user };
}

/** Signed in and approved by an admin (or is an admin). */
export async function requireApprovedUser(): Promise<AuthResult> {
  const result = await requireUser();
  if (!result.ok) return result;
  if (!result.user.isApproved && result.user.role !== "ADMIN") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Your account is waiting for admin approval" },
        { status: 403 }
      ),
    };
  }
  return result;
}

export async function requireAdmin(): Promise<AuthResult> {
  const result = await requireUser();
  if (!result.ok) return result;
  if (result.user.role !== "ADMIN") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Admin only" }, { status: 403 }),
    };
  }
  return result;
}

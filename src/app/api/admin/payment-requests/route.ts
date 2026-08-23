import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const status = new URL(req.url).searchParams.get("status");

  const requests = await prisma.paymentRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      player: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(requests);
}

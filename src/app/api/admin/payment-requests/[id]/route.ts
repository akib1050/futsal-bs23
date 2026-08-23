import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { SLOT_RATE } from "@/lib/finance";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reviewNote: z.string().max(300).optional().nullable(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const request = await prisma.paymentRequest.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (request.status !== "PENDING") {
    return NextResponse.json(
      { error: `Already ${request.status.toLowerCase()}` },
      { status: 409 }
    );
  }

  if (parsed.data.action === "REJECT") {
    const rejected = await prisma.paymentRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewNote: parsed.data.reviewNote || null,
        reviewedAt: new Date(),
        reviewedById: auth.user.id,
      },
    });
    return NextResponse.json(rejected);
  }

  const playerId = request.playerId ?? request.user.playerId;
  if (!playerId) {
    return NextResponse.json(
      { error: "Link this account to a player before approving." },
      { status: 400 }
    );
  }

  const approved = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        amount: request.amount,
        type: request.amount >= SLOT_RATE * 3 ? "PREPAID" : "SESSION",
        playerId,
        note: `${request.method} ${request.trxId} — approved`,
      },
    });

    return tx.paymentRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        playerId,
        paymentId: payment.id,
        reviewNote: parsed.data.reviewNote || null,
        reviewedAt: new Date(),
        reviewedById: auth.user.id,
      },
    });
  });

  return NextResponse.json(approved);
}

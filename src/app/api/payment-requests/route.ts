import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprovedUser, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  amount: z.number().int().min(50).max(50000),
  senderNumber: z.string().min(6).max(20),
  trxId: z.string().min(4).max(40),
  note: z.string().max(300).optional().nullable(),
  method: z.enum(["BKASH", "CASH"]).default("BKASH"),
});

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const requests = await prisma.paymentRequest.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(requests);
}

export async function POST(req: Request) {
  const auth = await requireApprovedUser();
  if (!auth.ok) return auth.response;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid amount, bKash number and transaction ID." },
      { status: 400 }
    );
  }

  const { amount, senderNumber, trxId, note, method } = parsed.data;

  const duplicate = await prisma.paymentRequest.findFirst({
    where: { trxId: trxId.trim(), status: { not: "REJECTED" } },
  });
  if (duplicate) {
    return NextResponse.json(
      { error: "This transaction ID was already submitted." },
      { status: 409 }
    );
  }

  const request = await prisma.paymentRequest.create({
    data: {
      userId: auth.user.id,
      playerId: auth.user.playerId,
      amount,
      method,
      senderNumber: senderNumber.trim(),
      trxId: trxId.trim(),
      note: note || null,
    },
  });

  return NextResponse.json(request, { status: 201 });
}

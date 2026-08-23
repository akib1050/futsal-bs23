import { NextResponse } from "next/server";
import { requireApprovedUser } from "@/lib/auth";
import { getPlayerBalances, getPoolSummary } from "@/lib/finance";

export async function GET() {
  const auth = await requireApprovedUser();
  if (!auth.ok) return auth.response;

  const [pool, balances] = await Promise.all([
    getPoolSummary(),
    getPlayerBalances(),
  ]);
  return NextResponse.json({ pool, balances });
}

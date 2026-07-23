import { NextResponse } from "next/server";
import { getPlayerBalances, getPoolSummary } from "@/lib/finance";

export async function GET() {
  const [pool, balances] = await Promise.all([
    getPoolSummary(),
    getPlayerBalances(),
  ]);
  return NextResponse.json({ pool, balances });
}

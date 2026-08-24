import { NextResponse } from "next/server";
import { requireApprovedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncTurfBookings } from "@/lib/turf-bookings";

export async function GET() {
  const auth = await requireApprovedUser();
  if (!auth.ok) return auth.response;

  try {
    let bookings = await prisma.turfBooking.findMany({
      orderBy: { date: "desc" },
    });

    if (bookings.length === 0) {
      await syncTurfBookings(prisma);
      bookings = await prisma.turfBooking.findMany({
        orderBy: { date: "desc" },
      });
    }

    return NextResponse.json(bookings);
  } catch (err) {
    console.error("GET /api/turf-bookings failed:", err);
    return NextResponse.json(
      { error: "Could not load Turf Nation bookings" },
      { status: 500 }
    );
  }
}

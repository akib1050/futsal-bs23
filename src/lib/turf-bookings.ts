/** Turf Nation bookings synced from turfnationbd.com (Akib account). */
export const TURF_NATION_BOOKINGS = [
  {
    bookingId: "210826B9",
    date: "2026-11-24",
    payableAmount: 4500,
    paidAmount: 500,
  },
  {
    bookingId: "210826B7",
    date: "2026-11-03",
    payableAmount: 4500,
    paidAmount: 500,
  },
  {
    bookingId: "210826B6",
    date: "2026-10-26",
    payableAmount: 4500,
    paidAmount: 500,
  },
  {
    bookingId: "210826B5",
    date: "2026-10-21",
    payableAmount: 4500,
    paidAmount: 500,
  },
  {
    bookingId: "130826B7",
    date: "2026-09-18",
    payableAmount: 4500,
    paidAmount: 500,
  },
  {
    bookingId: "150726B10",
    date: "2026-08-31",
    payableAmount: 4500,
    paidAmount: 500,
  },
  {
    bookingId: "150726B9",
    date: "2026-08-17",
    payableAmount: 4500,
    paidAmount: 500,
  },
  {
    bookingId: "160626B16",
    date: "2026-08-04",
    payableAmount: 4500,
    paidAmount: 500,
  },
  {
    bookingId: "160626B15",
    date: "2026-07-22",
    payableAmount: 4500,
    paidAmount: 500,
  },
  {
    bookingId: "070526B9",
    date: "2026-07-08",
    payableAmount: 4500,
    paidAmount: 500,
  },
  {
    bookingId: "020526B10",
    date: "2026-06-24",
    payableAmount: 4500,
    paidAmount: 500,
  },
  {
    bookingId: "020526B9",
    date: "2026-06-09",
    payableAmount: 4500,
    paidAmount: 500,
  },
  {
    bookingId: "181225B12",
    date: "2026-02-04",
    payableAmount: 4050,
    paidAmount: 500,
  },
  {
    bookingId: "151025B17",
    date: "2025-12-17",
    payableAmount: 4500,
    paidAmount: 500,
  },
  {
    bookingId: "050725B3",
    date: "2025-07-21",
    payableAmount: 4000,
    paidAmount: 500,
  },
] as const;

export async function syncTurfBookings(
  prisma: {
    turfBooking: {
      upsert: (args: {
        where: { bookingId: string };
        update: {
          date: Date;
          payableAmount: number;
          paidAmount: number;
          status: string;
        };
        create: {
          bookingId: string;
          date: Date;
          timeSlot: string;
          gameType: string;
          payableAmount: number;
          paidAmount: number;
          status: string;
        };
      }) => Promise<unknown>;
    };
  }
) {
  for (const b of TURF_NATION_BOOKINGS) {
    await prisma.turfBooking.upsert({
      where: { bookingId: b.bookingId },
      update: {
        date: new Date(`${b.date}T14:30:00.000Z`),
        payableAmount: b.payableAmount,
        paidAmount: b.paidAmount,
        status: "Due",
      },
      create: {
        bookingId: b.bookingId,
        date: new Date(`${b.date}T14:30:00.000Z`),
        timeSlot: "8:30 PM",
        gameType: "Football",
        payableAmount: b.payableAmount,
        paidAmount: b.paidAmount,
        status: "Due",
      },
    });
  }
}

export { isUpcomingBooking } from "@/lib/turf-booking-utils";

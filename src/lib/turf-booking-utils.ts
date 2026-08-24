export function isUpcomingBooking(date: string | Date, now = new Date()) {
  const d = typeof date === "string" ? new Date(date) : date;
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  return d >= start;
}

export type TurfBookingRow = {
  id: string;
  bookingId: string;
  date: string;
  timeSlot: string;
  gameType: string;
  payableAmount: number;
  paidAmount: number;
  status: string;
};

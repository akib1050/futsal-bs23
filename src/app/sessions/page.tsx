"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button, Field, SectionTitle, TabButton, chipClass, chipSelectedClass, inputClass } from "@/components/ui";
import { formatDate, formatTk } from "@/lib/format";
import { isUpcomingBooking } from "@/lib/turf-booking-utils";
import { useAuth } from "@/lib/use-auth";

type Player = { id: string; name: string; rating: number; isActive: boolean };

type Session = {
  id: string;
  date: string;
  turfCost: number;
  title: string | null;
  notes: string | null;
  players: {
    id: string;
    guestName: string | null;
    paidAmount: number;
    isPrepaidUse: boolean;
    player: { name: string } | null;
  }[];
  payments: { amount: number }[];
};

type TurfBooking = {
  id: string;
  bookingId: string;
  date: string;
  timeSlot: string;
  gameType: string;
  payableAmount: number;
  paidAmount: number;
  status: string;
};

type Tab = "upcoming" | "past-slots" | "logged";

export default function SessionsPage() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [turfBookings, setTurfBookings] = useState<TurfBooking[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [turfCost, setTurfCost] = useState(4050);
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [perHead, setPerHead] = useState(300);
  const [usePrepaid, setUsePrepaid] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPaid, setGuestPaid] = useState("");
  const [guests, setGuests] = useState<{ name: string; paid: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function readJson<T>(res: Response): Promise<T | null> {
    if (!res.ok) return null;
    try {
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const [sRes, pRes, bRes] = await Promise.all([
        fetch("/api/sessions"),
        fetch("/api/players"),
        fetch("/api/turf-bookings"),
      ]);

      const sData = await readJson<Session[]>(sRes);
      const pData = await readJson<Player[]>(pRes);
      const bData = await readJson<TurfBooking[]>(bRes);

      setSessions(Array.isArray(sData) ? sData : []);
      setPlayers(
        Array.isArray(pData) ? pData.filter((p: Player) => p.isActive) : []
      );
      setTurfBookings(Array.isArray(bData) ? bData : []);

      if (!sRes.ok || !pRes.ok || !bRes.ok) {
        setLoadError("Some session data could not be loaded. Try refreshing.");
      }
    } catch {
      setLoadError("Could not load sessions. Check your connection and refresh.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const upcomingBookings = useMemo(
    () =>
      turfBookings
        .filter((b) => isUpcomingBooking(b.date))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
    [turfBookings]
  );

  const pastBookings = useMemo(
    () =>
      turfBookings
        .filter((b) => !isUpcomingBooking(b.date))
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
    [turfBookings]
  );

  const loggedSlotDates = useMemo(
    () => new Set(sessions.map((s) => s.date.slice(0, 10))),
    [sessions]
  );

  const loggablePastSlots = useMemo(
    () =>
      pastBookings.filter(
        (b) => !loggedSlotDates.has(b.date.slice(0, 10))
      ),
    [pastBookings, loggedSlotDates]
  );

  const selectedSlot = useMemo(
    () => pastBookings.find((b) => b.id === selectedSlotId) ?? null,
    [pastBookings, selectedSlotId]
  );

  function selectSlot(slotId: string) {
    setSelectedSlotId(slotId);
    const slot = pastBookings.find((b) => b.id === slotId);
    if (slot) setTurfCost(slot.payableAmount);
  }

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([id]) => id),
    [selected]
  );

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function addGuest() {
    if (!guestName.trim()) return;
    const paid = guestPaid === "" ? 0 : Math.max(0, Number(guestPaid));
    setGuests((g) => [...g, { name: guestName.trim(), paid }]);
    setGuestName("");
    setGuestPaid("");
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;

    setSaving(true);
    const attendees = [
      ...selectedIds.map((playerId) => ({
        playerId,
        paidAmount: usePrepaid ? 0 : perHead,
        isPrepaidUse: usePrepaid,
      })),
      ...guests.map((g) => ({
        guestName: g.name,
        paidAmount: g.paid,
        isPrepaidUse: false,
      })),
    ];

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: selectedSlot.date.slice(0, 10),
        turfCost,
        title: `Europe — ${formatDate(selectedSlot.date)}`,
        notes: notes || null,
        attendees,
      }),
    });
    setSaving(false);
    if (!res.ok) return;
    setNotes("");
    setGuests([]);
    setGuestPaid("");
    setSelected({});
    setSelectedSlotId("");
    await load();
  }

  async function removeSession(id: string) {
    if (!confirm("Delete this session and its linked payments?")) return;
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    await load();
  }

  const expectedIn =
    selectedIds.length * (usePrepaid ? 0 : perHead) +
    guests.reduce((s, g) => s + g.paid, 0);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "upcoming", label: "Upcoming", count: upcomingBookings.length },
    { id: "past-slots", label: "Past slots", count: pastBookings.length },
    { id: "logged", label: "Logged sessions", count: sessions.length },
  ];

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Sessions"
        subtitle="Turf Nation bookings and logged match history for BS23 Europe."
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <TabButton
            key={t.id}
            active={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span className="ml-2 text-xs opacity-60">({t.count})</span>
          </TabButton>
        ))}
      </div>

      {loadError ? (
        <p className="rounded-md border border-amber/30 bg-amber/10 px-3 py-2 text-sm text-amber">
          {loadError}
        </p>
      ) : null}

      {tab === "upcoming" ? (
        loading ? (
          <p className="text-chalk/50">Loading upcoming slots…</p>
        ) : upcomingBookings.length === 0 ? (
          <p className="text-chalk/50">No upcoming Turf Nation slots.</p>
        ) : (
          <ul className="space-y-3">
            {upcomingBookings.map((b) => (
              <TurfBookingCard key={b.id} booking={b} accent="lime" />
            ))}
          </ul>
        )
      ) : null}

      {tab === "past-slots" ? (
        loading ? (
          <p className="text-chalk/50">Loading past slots…</p>
        ) : pastBookings.length === 0 ? (
          <p className="text-chalk/50">No past Turf Nation slots on record.</p>
        ) : (
          <ul className="space-y-3">
            {pastBookings.map((b) => (
              <TurfBookingCard key={b.id} booking={b} accent="chalk" />
            ))}
          </ul>
        )
      ) : null}

      {tab === "logged" ? (
        <>
          {isAdmin ? (
            <form onSubmit={onCreate} className="glow-lime space-y-4 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Past slot">
                  <select
                    className={inputClass}
                    value={selectedSlotId}
                    onChange={(e) => selectSlot(e.target.value)}
                    required
                  >
                    <option value="">Pick a past Turf Nation slot…</option>
                    {loggablePastSlots.map((b) => (
                      <option key={b.id} value={b.id}>
                        {formatDate(b.date)} · {b.timeSlot} · {b.bookingId}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Turf cost (৳)">
                  <input
                    className={inputClass}
                    type="number"
                    min={1}
                    value={turfCost}
                    onChange={(e) => setTurfCost(Number(e.target.value))}
                    required
                  />
                </Field>
              </div>

              {loggablePastSlots.length === 0 && !loading ? (
                <p className="text-sm text-chalk/55">
                  All past Turf Nation slots are already logged.
                </p>
              ) : null}

              {selectedSlot ? (
                <p className="text-sm text-chalk/60">
                  Logging{" "}
                  <span className="text-lime">
                    {formatDate(selectedSlot.date)} · {selectedSlot.timeSlot}
                  </span>
                  {" · "}
                  {formatTk(selectedSlot.payableAmount)} booked on Turf Nation
                </p>
              ) : null}

              <Field label="Notes">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes"
                />
              </Field>

              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={usePrepaid}
                    onChange={(e) => setUsePrepaid(e.target.checked)}
                  />
                  Use prepaid slots (0 cash from selected roster)
                </label>
                {!usePrepaid ? (
                  <Field label="Roster per head (৳)">
                    <input
                      className={`${inputClass} w-28`}
                      type="number"
                      min={0}
                      value={perHead}
                      onChange={(e) => setPerHead(Number(e.target.value))}
                    />
                  </Field>
                ) : null}
              </div>

              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.14em] text-chalk/50">
                  Roster attendees
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {players.map((p) => (
                    <label
                      key={p.id}
                      className={`${chipClass} ${
                        selected[p.id] ? chipSelectedClass : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!selected[p.id]}
                        onChange={() => toggle(p.id)}
                      />
                      <span>{p.name}</span>
                      <span className="ml-auto text-chalk/70">{p.rating}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                <Field label="Guest name">
                  <input
                    className={inputClass}
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Guest name"
                  />
                </Field>
                <Field label="Guest paid (৳)">
                  <input
                    className={inputClass}
                    type="number"
                    min={0}
                    value={guestPaid}
                    onChange={(e) => setGuestPaid(e.target.value)}
                    placeholder="Any amount"
                  />
                </Field>
                <div className="flex items-end">
                  <Button type="button" variant="ghost" onClick={addGuest}>
                    Add guest
                  </Button>
                </div>
              </div>
              {guests.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {guests.map((g, i) => (
                    <li
                      key={`${g.name}-${i}`}
                      className="rounded-md bg-amber/15 px-2.5 py-1 text-sm text-amber"
                    >
                      {g.name} · {formatTk(g.paid)}
                      <button
                        type="button"
                        className="ml-2 opacity-70 hover:opacity-100"
                        onClick={() =>
                          setGuests((list) => list.filter((_, idx) => idx !== i))
                        }
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                <p className="text-sm text-chalk/60">
                  Expected in:{" "}
                  <span className="text-lime">{formatTk(expectedIn)}</span>
                  {" · "}
                  After turf:{" "}
                  <span className="text-amber">
                    {formatTk(expectedIn - turfCost)}
                  </span>
                </p>
                <Button type="submit" disabled={saving || !selectedSlotId}>
                  {saving ? "Saving…" : "Save session"}
                </Button>
              </div>
            </form>
          ) : null}

          {loading ? (
            <p className="text-chalk/50">Loading sessions…</p>
          ) : sessions.length === 0 ? (
            <p className="text-chalk/50">No logged sessions yet.</p>
          ) : (
            <ul className="space-y-3">
              {sessions.map((s) => {
                const collected = s.payments.reduce(
                  (sum, p) => sum + p.amount,
                  0
                );
                return (
                  <li key={s.id} className="card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-[family-name:var(--font-display)] text-2xl tracking-wide">
                          {s.title || "Session"}
                        </h3>
                        <p className="text-sm text-chalk/55">
                          {formatDate(s.date)} · {s.players.length} on pitch
                        </p>
                        {s.notes ? (
                          <p className="mt-1 text-sm text-chalk/70">{s.notes}</p>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <p className="text-amber">{formatTk(s.turfCost)} turf</p>
                        <p className="text-sm text-lime">
                          {formatTk(collected)} in
                        </p>
                        {isAdmin ? (
                          <Button
                            type="button"
                            variant="danger"
                            className="mt-2"
                            onClick={() => removeSession(s.id)}
                          >
                            Delete
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {s.players.map((a) => (
                        <span
                          key={a.id}
                          className="rounded-md border border-line bg-pitch-deep/50 px-2 py-1 text-xs"
                        >
                          {a.player?.name || a.guestName}
                          {a.isPrepaidUse
                            ? " · prepaid"
                            : ` · ${formatTk(a.paidAmount)}`}
                        </span>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );
}

function TurfBookingCard({
  booking,
  accent,
}: {
  booking: TurfBooking;
  accent: "lime" | "chalk";
}) {
  const due = booking.payableAmount - booking.paidAmount;
  const accentClass = accent === "lime" ? "text-lime" : "text-chalk/80";

  return (
    <li className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-chalk/45">
            Booking {booking.bookingId}
          </p>
          <h3
            className={`mt-1 font-[family-name:var(--font-display)] text-2xl tracking-wide ${accentClass}`}
          >
            {formatDate(booking.date)} · {booking.timeSlot}
          </h3>
          <p className="mt-1 text-sm text-chalk/55">
            {booking.gameType} · Turf Nation
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="text-amber">{formatTk(booking.payableAmount)} payable</p>
          <p className="text-lime">{formatTk(booking.paidAmount)} paid</p>
          <p className="mt-1 text-chalk/60">
            Due: <span className="text-amber">{formatTk(due)}</span>
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide text-chalk/45">
            {booking.status}
          </p>
        </div>
      </div>
    </li>
  );
}

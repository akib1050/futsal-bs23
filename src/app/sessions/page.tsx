"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button, Field, SectionTitle, inputClass } from "@/components/ui";
import { formatDate, formatTk } from "@/lib/format";
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

export default function SessionsPage() {
  const { isAdmin } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [turfCost, setTurfCost] = useState(4050);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [perHead, setPerHead] = useState(300);
  const [usePrepaid, setUsePrepaid] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guests, setGuests] = useState<{ name: string; paid: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [sRes, pRes] = await Promise.all([
      fetch("/api/sessions"),
      fetch("/api/players"),
    ]);
    const sData = await sRes.json();
    const pData = await pRes.json();
    setSessions(Array.isArray(sData) ? sData : []);
    setPlayers(Array.isArray(pData) ? pData.filter((p: Player) => p.isActive) : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([id]) => id),
    [selected]
  );

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function addGuest() {
    if (!guestName.trim()) return;
    setGuests((g) => [...g, { name: guestName.trim(), paid: perHead }]);
    setGuestName("");
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
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
        date,
        turfCost,
        title: title || null,
        notes: notes || null,
        attendees,
      }),
    });
    setSaving(false);
    if (!res.ok) return;
    setTitle("");
    setNotes("");
    setGuests([]);
    setSelected({});
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

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Sessions"
        subtitle="Every Europe slot — who played, turf cost, and what came in."
      />

      {isAdmin ? (
      <form
        onSubmit={onCreate}
        className="space-y-4 rounded-xl border border-line bg-pitch/50 p-4 glow-lime"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Date">
            <input
              className={inputClass}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
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
          <Field label="Title">
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Europe — date"
            />
          </Field>
        </div>

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
            <Field label="Per head (৳)">
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
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                  selected[p.id]
                    ? "border-lime/40 bg-lime/10"
                    : "border-line bg-pitch-deep/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!selected[p.id]}
                  onChange={() => toggle(p.id)}
                />
                <span>{p.name}</span>
                <span className="ml-auto text-lime">{p.rating}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Field label="Add guest">
            <input
              className={inputClass}
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Guest name"
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
            Expected in: <span className="text-lime">{formatTk(expectedIn)}</span>
            {" · "}
            After turf:{" "}
            <span className="text-amber">
              {formatTk(expectedIn - turfCost)}
            </span>
          </p>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save session"}
          </Button>
        </div>
      </form>
      ) : null}

      {loading ? (
        <p className="text-chalk/50">Loading sessions…</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => {
            const collected = s.payments.reduce((sum, p) => sum + p.amount, 0);
            return (
              <li
                key={s.id}
                className="rounded-xl border border-line bg-pitch/40 p-4"
              >
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
    </div>
  );
}

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button, DataTable, Field, SectionTitle, inputClass } from "@/components/ui";
import { SLOT_RATE } from "@/lib/finance";
import { formatTk } from "@/lib/format";
import { JERSEY_SIZES } from "@/lib/jersey";
import {
  downloadCsv,
  downloadPlayersPdf,
  playersToCsv,
  type ExportPlayerRow,
} from "@/lib/player-export";
import { useAuth } from "@/lib/use-auth";

type Player = {
  id: string;
  name: string;
  rating: number;
  jerseySize: string | null;
  notes: string | null;
  isActive: boolean;
  payments: { amount: number; type: string }[];
  attendance?: { id: string }[];
  _count: { attendance: number };
};

function moneyFor(player: Player) {
  const totalPaid = player.payments.reduce((s, p) => s + p.amount, 0);
  const sessions = player._count?.attendance ?? player.attendance?.length ?? 0;
  const charged = sessions * SLOT_RATE;
  const credit = totalPaid - charged;
  const cashIn = player.payments
    .filter((p) => p.type !== "ADJUSTMENT")
    .reduce((s, p) => s + p.amount, 0);
  return { totalPaid: cashIn, charged, credit, sessions };
}

export default function PlayersPage() {
  const { isAdmin } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(7);
  const [jerseySize, setJerseySize] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [creditDrafts, setCreditDrafts] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const res = await fetch("/api/players");
    const data = await res.json();
    const list: Player[] = Array.isArray(data) ? data : [];
    setPlayers(list);
    const drafts: Record<string, string> = {};
    for (const p of list) {
      drafts[p.id] = String(moneyFor(p).credit);
    }
    setCreditDrafts(drafts);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const exportRows: ExportPlayerRow[] = useMemo(
    () =>
      players.map((p) => {
        const m = moneyFor(p);
        return {
          name: p.name,
          rating: p.rating,
          jerseySize: p.jerseySize,
          totalPaid: m.totalPaid,
          charged: m.charged,
          credit: m.credit,
          sessions: m.sessions,
          isActive: p.isActive,
        };
      }),
    [players]
  );

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        rating,
        jerseySize: jerseySize || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not add player");
      return;
    }
    setName("");
    setRating(7);
    setJerseySize("");
    await load();
  }

  async function patchPlayer(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/players/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      setError("Could not update player");
      return;
    }
    await load();
  }

  async function deactivate(id: string) {
    await fetch(`/api/players/${id}`, { method: "DELETE" });
    await load();
  }

  async function addPrepaid(id: string) {
    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 900,
        type: "PREPAID",
        playerId: id,
        note: "3-slot prepaid package",
      }),
    });
    await load();
  }

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Players"
        subtitle="Roster credit, jersey sizes, and ratings for team maker."
        action={
          isAdmin ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  downloadCsv(
                    `futsalbuddies-players-${new Date().toISOString().slice(0, 10)}.csv`,
                    playersToCsv(exportRows)
                  )
                }
              >
                Download CSV
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => downloadPlayersPdf(exportRows)}
              >
                Download PDF
              </Button>
            </div>
          ) : null
        }
      />

      {isAdmin ? (
        <form
          onSubmit={onCreate}
          className="glow-lime grid gap-3 p-4 sm:grid-cols-[1fr_120px_120px_auto]"
        >
          <Field label="Name">
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Player name"
              required
            />
          </Field>
          <Field label="Rating">
            <input
              className={inputClass}
              type="number"
              min={1}
              max={10}
              step={0.5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Jersey">
            <select
              className={inputClass}
              value={jerseySize}
              onChange={(e) => setJerseySize(e.target.value)}
            >
              <option value="">Size</option>
              {JERSEY_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? "Saving…" : "Add player"}
            </Button>
          </div>
          {error ? (
            <p className="text-sm text-danger sm:col-span-4">{error}</p>
          ) : null}
        </form>
      ) : null}

      {loading ? (
        <p className="text-chalk/50">Loading players…</p>
      ) : (
        <DataTable minWidth="860px">
          <thead className="text-xs uppercase tracking-wider text-chalk/45">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Jersey</th>
              <th className="px-4 py-3 font-medium">Total paid</th>
              <th className="px-4 py-3 font-medium">Current credit</th>
              <th className="px-4 py-3 font-medium">Sessions</th>
              {isAdmin ? (
                <th className="px-4 py-3 font-medium">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const m = moneyFor(p);
              return (
                <tr
                  key={p.id}
                  className={`border-t border-line ${!p.isActive ? "opacity-45" : ""}`}
                >
                  <td className="px-4 py-3 font-medium">
                    {p.name}
                    {!p.isActive ? (
                      <span className="ml-2 text-xs text-chalk/40">inactive</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <input
                        className="w-20 rounded border border-line bg-pitch-deep px-2 py-1 text-chalk"
                        type="number"
                        min={1}
                        max={10}
                        step={0.5}
                        defaultValue={p.rating}
                        onBlur={(e) =>
                          patchPlayer(p.id, { rating: Number(e.target.value) })
                        }
                      />
                    ) : (
                      <span className="text-chalk/80">{p.rating}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <select
                        className="rounded border border-line bg-pitch-deep px-2 py-1 text-sm"
                        value={p.jerseySize ?? ""}
                        onChange={(e) =>
                          patchPlayer(p.id, {
                            jerseySize: e.target.value || null,
                          })
                        }
                      >
                        <option value="">—</option>
                        {JERSEY_SIZES.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>{p.jerseySize || "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatTk(m.totalPaid)}</td>
                  <td
                    className={`px-4 py-3 ${
                      m.credit < 0 ? "text-danger" : "text-lime"
                    }`}
                  >
                    {isAdmin ? (
                      <div className="flex items-center gap-2">
                        <input
                          className="w-24 rounded border border-line bg-pitch-deep px-2 py-1 text-sm"
                          type="number"
                          value={creditDrafts[p.id] ?? String(m.credit)}
                          onChange={(e) =>
                            setCreditDrafts((prev) => ({
                              ...prev,
                              [p.id]: e.target.value,
                            }))
                          }
                          onBlur={() => {
                            const next = Number(creditDrafts[p.id]);
                            if (!Number.isFinite(next) || next === m.credit) return;
                            patchPlayer(p.id, { credit: Math.round(next) });
                          }}
                        />
                        <span className="text-xs text-chalk/45">৳</span>
                      </div>
                    ) : m.credit < 0 ? (
                      `owes ${formatTk(Math.abs(m.credit))}`
                    ) : (
                      formatTk(m.credit)
                    )}
                  </td>
                  <td className="px-4 py-3">{m.sessions}</td>
                  {isAdmin ? (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {p.isActive ? (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => addPrepaid(p.id)}
                            >
                              +900 prepaid
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              onClick={() => deactivate(p.id)}
                            >
                              Deactivate
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}

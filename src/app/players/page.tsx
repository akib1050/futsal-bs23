"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button, Field, SectionTitle, inputClass } from "@/components/ui";
import { formatTk } from "@/lib/format";

type Player = {
  id: string;
  name: string;
  rating: number;
  notes: string | null;
  isActive: boolean;
  payments: { amount: number; type: string }[];
  _count: { attendance: number };
};

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(7);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/players");
    const data = await res.json();
    setPlayers(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, rating }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not add player");
      return;
    }
    setName("");
    setRating(7);
    await load();
  }

  async function updateRating(id: string, next: number) {
    await fetch(`/api/players/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: next }),
    });
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
        subtitle="Roster with skill ratings used by the team maker. Prepaid = 900 ৳ for 3 slots."
      />

      <form
        onSubmit={onCreate}
        className="glow-lime grid gap-3 rounded-xl border border-line bg-pitch/50 p-4 sm:grid-cols-[1fr_140px_auto]"
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
        <Field label="Rating (1–10)">
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
        <div className="flex items-end">
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving…" : "Add player"}
          </Button>
        </div>
        {error ? (
          <p className="text-sm text-danger sm:col-span-3">{error}</p>
        ) : null}
      </form>

      {loading ? (
        <p className="text-chalk/50">Loading players…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-pitch/40">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-chalk/45">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Paid in</th>
                <th className="px-4 py-3 font-medium">Sessions</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => {
                const paid = p.payments
                  .filter((x) => x.type !== "ADJUSTMENT")
                  .reduce((s, x) => s + x.amount, 0);
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
                      <input
                        className="w-20 rounded border border-line bg-pitch-deep px-2 py-1 text-lime"
                        type="number"
                        min={1}
                        max={10}
                        step={0.5}
                        defaultValue={p.rating}
                        onBlur={(e) =>
                          updateRating(p.id, Number(e.target.value))
                        }
                      />
                    </td>
                    <td className="px-4 py-3">{formatTk(paid)}</td>
                    <td className="px-4 py-3">{p._count.attendance}</td>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

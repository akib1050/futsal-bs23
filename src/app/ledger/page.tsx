"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button, Field, SectionTitle, inputClass } from "@/components/ui";
import { formatDate, formatTk } from "@/lib/format";
import { useAuth } from "@/lib/use-auth";

type Payment = {
  id: string;
  amount: number;
  type: string;
  guestName: string | null;
  note: string | null;
  createdAt: string;
  player: { name: string } | null;
  session: { title: string | null; date: string } | null;
};

type Player = { id: string; name: string; isActive: boolean };

export default function LedgerPage() {
  const { isAdmin } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [amount, setAmount] = useState(300);
  const [type, setType] = useState("SESSION");
  const [playerId, setPlayerId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const [payRes, playerRes] = await Promise.all([
      fetch("/api/payments"),
      fetch("/api/players"),
    ]);
    const payData = await payRes.json();
    const plist = await playerRes.json();
    setPayments(Array.isArray(payData) ? payData : []);
    setPlayers(Array.isArray(plist) ? plist.filter((p: Player) => p.isActive) : []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        type,
        playerId: playerId || null,
        guestName: guestName || null,
        note: note || null,
      }),
    });
    setSaving(false);
    setNote("");
    setGuestName("");
    await load();
  }

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Ledger"
        subtitle="Every taka in or out of the pool — prepaid, session pays, guests, adjustments."
      />

      {isAdmin ? (
      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-xl border border-line bg-pitch/50 p-4 glow-lime sm:grid-cols-2 lg:grid-cols-3"
      >
        <Field label="Amount (৳, negative = out)">
          <input
            className={inputClass}
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
          />
        </Field>
        <Field label="Type">
          <select
            className={inputClass}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="PREPAID">Prepaid</option>
            <option value="SESSION">Session</option>
            <option value="GUEST">Guest</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
        </Field>
        <Field label="Player (optional)">
          <select
            className={inputClass}
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
          >
            <option value="">— none —</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Guest name (optional)">
          <input
            className={inputClass}
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Raad, Mehedi…"
          />
        </Field>
        <Field label="Note">
          <input
            className={inputClass}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What is this for?"
          />
        </Field>
        <div className="flex items-end">
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Saving…" : "Add entry"}
          </Button>
        </div>
      </form>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-line bg-pitch/40">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wider text-chalk/45">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Who</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Note</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="px-4 py-2.5 text-chalk/55">
                  {formatDate(p.createdAt)}
                </td>
                <td className="px-4 py-2.5">
                  {p.player?.name || p.guestName || "—"}
                </td>
                <td className="px-4 py-2.5 text-chalk/70">{p.type}</td>
                <td
                  className={`px-4 py-2.5 ${
                    p.amount < 0 ? "text-danger" : "text-lime"
                  }`}
                >
                  {formatTk(p.amount)}
                </td>
                <td className="px-4 py-2.5 text-chalk/55">
                  {p.note ||
                    (p.session
                      ? `${p.session.title || "Session"} · ${formatDate(p.session.date)}`
                      : "—")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Button,
  DataTable,
  SectionTitle,
  StatusPill,
  inputClass,
} from "@/components/ui";
import { formatDate, formatTk } from "@/lib/format";

type AdminRequest = {
  id: string;
  amount: number;
  method: string;
  trxId: string;
  senderNumber: string;
  status: string;
  note: string | null;
  reviewNote: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; phone: string | null };
  player: { id: string; name: string } | null;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isApproved: boolean;
  playerId: string | null;
  createdAt: string;
  player: { id: string; name: string } | null;
};

type RosterPlayer = { id: string; name: string; user: { id: string } | null };

export default function AdminPage() {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [players, setPlayers] = useState<RosterPlayer[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [reqRes, userRes] = await Promise.all([
      fetch("/api/admin/payment-requests"),
      fetch("/api/admin/users"),
    ]);
    if (reqRes.ok) setRequests(await reqRes.json());
    if (userRes.ok) {
      const data = await userRes.json();
      setUsers(data.users);
      setPlayers(data.players);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function review(id: string, action: "APPROVE" | "REJECT") {
    setBusy(id);
    setError("");
    const res = await fetch(`/api/admin/payment-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not update that request.");
    }
    setBusy(null);
    await load();
  }

  async function updateUser(id: string, body: Record<string, unknown>) {
    setBusy(id);
    setError("");
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not update that account.");
    }
    setBusy(null);
    await load();
  }

  const pending = requests.filter((r) => r.status === "PENDING");
  const reviewed = requests.filter((r) => r.status !== "PENDING");
  const pendingUsers = users.filter((u) => !u.isApproved);
  const activeUsers = users.filter((u) => u.isApproved);

  if (loading) return <p className="text-chalk/50">Loading admin portal…</p>;

  return (
    <div className="space-y-10">
      <SectionTitle
        title="Admin portal"
        subtitle="Approve bKash payments and player accounts. Approving a payment adds it to the pool and the player's credit."
      />

      {error ? (
        <p className="rounded-md bg-danger/15 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-wide text-chalk">
            Pending payments
          </h2>
          <p className="text-sm text-chalk/55">
            {pending.length} waiting ·{" "}
            <span className="text-amber">
              {formatTk(pending.reduce((s, r) => s + r.amount, 0))}
            </span>
          </p>
        </div>

        <ul className="space-y-3">
          {pending.map((r) => (
            <li
              key={r.id}
              className="card border-amber/30 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-3xl tracking-wide text-amber">
                    {formatTk(r.amount)}
                  </p>
                  <p className="mt-1 text-chalk">
                    {r.player?.name || r.user.name}{" "}
                    <span className="text-chalk/50">· {r.user.email}</span>
                  </p>
                  <p className="mt-1 text-sm text-chalk/60">
                    {r.method} from {r.senderNumber} · trx{" "}
                    <span className="text-chalk">{r.trxId}</span>
                  </p>
                  {r.note ? (
                    <p className="mt-1 text-sm text-chalk/55">{r.note}</p>
                  ) : null}
                  {!r.player ? (
                    <p className="mt-2 text-sm text-danger">
                      Link this account to a player below before approving.
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-sm text-chalk/45">
                    {formatDate(r.createdAt)}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      disabled={busy === r.id}
                      onClick={() => review(r.id, "APPROVE")}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      disabled={busy === r.id}
                      onClick={() => review(r.id, "REJECT")}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {pending.length === 0 ? (
            <p className="text-sm text-chalk/50">No payments waiting. All clear.</p>
          ) : null}
        </ul>
      </section>

      <section>
        <SectionTitle
          title="Accounts"
          subtitle="Approve new registrations and link them to their player card."
        />

        <div className="space-y-3">
          {[...pendingUsers, ...activeUsers].map((u) => (
            <div
              key={u.id}
              className={`p-4 ${u.isApproved ? "card" : "glow-lime"}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-chalk">
                    {u.name}
                    {u.role === "ADMIN" ? (
                      <span className="ml-2 rounded bg-lime/15 px-1.5 py-0.5 text-xs text-lime">
                        admin
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-chalk/55">
                    {u.email}
                    {u.phone ? ` · ${u.phone}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-chalk/45">
                    Player card: {u.player?.name || "not linked"} · joined{" "}
                    {formatDate(u.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className={`${inputClass} w-44`}
                    value={u.playerId || ""}
                    onChange={(e) =>
                      updateUser(u.id, { playerId: e.target.value || null })
                    }
                    disabled={busy === u.id}
                  >
                    <option value="">— no player —</option>
                    {players.map((p) => (
                      <option
                        key={p.id}
                        value={p.id}
                        disabled={!!p.user && p.id !== u.playerId}
                      >
                        {p.name}
                      </option>
                    ))}
                  </select>

                  {!u.player ? (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busy === u.id}
                      onClick={() =>
                        updateUser(u.id, { newPlayerName: u.name })
                      }
                    >
                      Create player
                    </Button>
                  ) : null}

                  {u.isApproved ? (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={busy === u.id || u.role === "ADMIN"}
                      onClick={() => updateUser(u.id, { isApproved: false })}
                    >
                      Revoke
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={busy === u.id}
                      onClick={() => updateUser(u.id, { isApproved: true })}
                    >
                      Approve
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title="Reviewed payments" subtitle="Approved and rejected history" />
        <DataTable minWidth="640px">
          <thead className="text-xs uppercase tracking-wider text-chalk/45">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Player</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Trx ID</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {reviewed.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="px-4 py-2.5 text-chalk/55">
                  {formatDate(r.createdAt)}
                </td>
                <td className="px-4 py-2.5">
                  {r.player?.name || r.user.name}
                </td>
                <td className="px-4 py-2.5">{formatTk(r.amount)}</td>
                <td className="px-4 py-2.5 text-chalk/70">{r.trxId}</td>
                <td className="px-4 py-2.5">
                  <StatusPill status={r.status} />
                </td>
              </tr>
            ))}
            {reviewed.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-chalk/50" colSpan={5}>
                  Nothing reviewed yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </DataTable>
      </section>
    </div>
  );
}

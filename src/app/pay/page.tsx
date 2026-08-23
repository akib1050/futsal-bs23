"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Button,
  Field,
  SectionTitle,
  StatusPill,
  inputClass,
} from "@/components/ui";
import { formatDate, formatTk } from "@/lib/format";

const BKASH_NUMBER = process.env.NEXT_PUBLIC_BKASH_NUMBER || "01796620959";
const PRESETS = [300, 600, 900, 1200];

type PaymentRequest = {
  id: string;
  amount: number;
  method: string;
  trxId: string;
  senderNumber: string;
  status: string;
  reviewNote: string | null;
  createdAt: string;
};

export default function PayPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [amount, setAmount] = useState(900);
  const [senderNumber, setSenderNumber] = useState("");
  const [trxId, setTrxId] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/payment-requests");
    if (res.ok) setRequests(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function copyNumber() {
    await navigator.clipboard.writeText(BKASH_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/payment-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        senderNumber,
        trxId,
        note: note || null,
        method: "BKASH",
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not submit your payment.");
      return;
    }

    setSuccess("Payment submitted. Admin will approve it shortly.");
    setTrxId("");
    setNote("");
    await load();
  }

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Pay with bKash"
        subtitle="Send money, then submit the transaction ID so the admin can approve it."
      />

      <section className="glow-lime rounded-xl border border-lime/25 bg-lime/5 p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-chalk/55">
          bKash — Send Money to
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <p className="font-[family-name:var(--font-display)] text-4xl tracking-wider text-lime sm:text-5xl">
            {BKASH_NUMBER}
          </p>
          <Button type="button" variant="ghost" onClick={copyNumber}>
            {copied ? "Copied" : "Copy number"}
          </Button>
        </div>
        <ol className="mt-4 space-y-1 text-sm text-chalk/65">
          <li>1. Open bKash → Send Money to {BKASH_NUMBER}</li>
          <li>2. Enter the amount (one slot is {formatTk(300)})</li>
          <li>3. Copy the transaction ID from the confirmation</li>
          <li>4. Submit it below — your credit updates once approved</li>
        </ol>
      </section>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-line bg-pitch/50 p-5"
      >
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-chalk/50">
            Amount
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(p)}
                className={`rounded-md border px-3 py-2 text-sm transition ${
                  amount === p
                    ? "border-lime/50 bg-lime/15 text-lime"
                    : "border-line bg-pitch-deep/50 text-chalk/70 hover:bg-white/5"
                }`}
              >
                {formatTk(p)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Amount sent (৳)">
            <input
              className={inputClass}
              type="number"
              min={50}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Your bKash number">
            <input
              className={inputClass}
              value={senderNumber}
              onChange={(e) => setSenderNumber(e.target.value)}
              placeholder="017…"
              required
            />
          </Field>
          <Field label="Transaction ID">
            <input
              className={inputClass}
              value={trxId}
              onChange={(e) => setTrxId(e.target.value.toUpperCase())}
              placeholder="e.g. 9F7K2LMQ1P"
              required
            />
          </Field>
        </div>

        <Field label="Note (optional)">
          <input
            className={inputClass}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="For next 3 slots…"
          />
        </Field>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {success ? <p className="text-sm text-lime">{success}</p> : null}

        <Button type="submit" disabled={saving}>
          {saving ? "Submitting…" : "Submit payment"}
        </Button>
      </form>

      <section>
        <SectionTitle title="My submissions" subtitle="Status of every bKash payment you sent" />
        <div className="overflow-x-auto rounded-xl border border-line bg-pitch/40">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wider text-chalk/45">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Trx ID</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-4 py-2.5 text-chalk/55">
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="px-4 py-2.5">{formatTk(r.amount)}</td>
                  <td className="px-4 py-2.5 text-chalk/70">{r.trxId}</td>
                  <td className="px-4 py-2.5">
                    <StatusPill status={r.status} />
                    {r.reviewNote ? (
                      <span className="ml-2 text-chalk/45">{r.reviewNote}</span>
                    ) : null}
                  </td>
                </tr>
              ))}
              {requests.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-chalk/50" colSpan={4}>
                    Nothing submitted yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
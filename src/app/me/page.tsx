import Link from "next/link";
import { redirect } from "next/navigation";
import { SectionTitle, Stat } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { SLOT_RATE, getPlayerStats, paymentTypeLabel } from "@/lib/finance";
import { formatDate, formatTk } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MyCardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [stats, requests] = await Promise.all([
    user.playerId ? getPlayerStats(user.playerId) : null,
    prisma.paymentRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const pendingTotal = requests
    .filter((r) => r.status === "PENDING")
    .reduce((s, r) => s + r.amount, 0);

  if (!stats) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-xl border border-line bg-pitch/50 p-6 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-wide">
          Hi {user.name}
        </h1>
        <p className="mt-3 text-chalk/65">
          Your account isn&apos;t linked to a player card yet. Once the admin
          links you, your credit and match history will show up here.
        </p>
      </div>
    );
  }

  const owes = stats.credit < 0;

  return (
    <div className="space-y-9">
      <section className="anim-rise">
        <p className="text-xs uppercase tracking-[0.28em] text-lime/80">
          My card
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-5xl leading-none tracking-wide text-chalk sm:text-6xl">
          {stats.name}
        </h1>
        <p className="mt-2 text-chalk/60">
          Rating <span className="text-lime">{stats.rating.toFixed(1)}</span> ·{" "}
          {stats.sessionsAttended} sessions played ·{" "}
          {stats.lastPlayed
            ? `last played ${formatDate(stats.lastPlayed)}`
            : "no matches yet"}
        </p>
      </section>

      <section className="anim-rise-delay-1 grid gap-3 sm:grid-cols-3">
        <Stat
          label={owes ? "You owe" : "Your credit"}
          value={formatTk(Math.abs(stats.credit))}
          hint={
            owes
              ? "Please clear this to keep playing"
              : `${stats.slotsLeft} slot${stats.slotsLeft === 1 ? "" : "s"} covered`
          }
          accent={owes ? "amber" : "lime"}
        />
        <Stat
          label="Total paid in"
          value={formatTk(stats.totalPaid)}
          hint="Approved payments only"
          accent="chalk"
        />
        <Stat
          label="Charged so far"
          value={formatTk(stats.charged)}
          hint={`${formatTk(SLOT_RATE)} per session`}
          accent="chalk"
        />
      </section>

      <section className="anim-rise-delay-2 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-lime/25 bg-lime/5 p-5">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-wide text-lime">
            {owes ? `Pay ${formatTk(Math.abs(stats.credit))}` : "Top up credit"}
          </h2>
          <p className="mt-1 text-sm text-chalk/65">
            Send bKash, submit the transaction ID, admin approves — credit
            updates instantly.
          </p>
          {pendingTotal > 0 ? (
            <p className="mt-2 text-sm text-amber">
              {formatTk(pendingTotal)} waiting for admin approval
            </p>
          ) : null}
        </div>
        <Link
          href="/pay"
          className="rounded-md bg-lime px-4 py-2.5 font-medium text-pitch-deep transition hover:bg-lime/90"
        >
          Go to payment
        </Link>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-line bg-pitch/40 p-5">
          <SectionTitle
            title="Match history"
            subtitle={`Every session you played, charged at ${formatTk(SLOT_RATE)}`}
          />
          <ul className="space-y-2">
            {stats.history.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between border-b border-line pb-2 text-sm last:border-0"
              >
                <div>
                  <p className="text-chalk">{h.title || "Futsal session"}</p>
                  <p className="text-chalk/50">{formatDate(h.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-amber">−{formatTk(h.charge)}</p>
                  <p className="text-chalk/45">
                    {h.usedPrepaid ? "prepaid slot" : `paid ${formatTk(h.paidAtSession)}`}
                  </p>
                </div>
              </li>
            ))}
            {stats.history.length === 0 ? (
              <p className="text-sm text-chalk/50">No sessions yet.</p>
            ) : null}
          </ul>
        </div>

        <div className="rounded-xl border border-line bg-pitch/40 p-5">
          <SectionTitle
            title="My payments"
            subtitle="Approved money in, and requests under review"
          />
          <ul className="space-y-2">
            {requests
              .filter((r) => r.status === "PENDING")
              .map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-amber/25 bg-amber/5 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="text-amber">{formatTk(r.amount)} · pending</p>
                    <p className="text-chalk/50">
                      {r.method} · trx {r.trxId}
                    </p>
                  </div>
                  <span className="text-chalk/45">{formatDate(r.createdAt)}</span>
                </li>
              ))}

            {stats.payments.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between border-b border-line pb-2 text-sm last:border-0"
              >
                <div>
                  <p className={p.amount < 0 ? "text-danger" : "text-lime"}>
                    {formatTk(p.amount)}
                  </p>
                  <p className="text-chalk/50">
                    {paymentTypeLabel(p.type)}
                    {p.note ? ` · ${p.note}` : ""}
                  </p>
                </div>
                <span className="text-chalk/45">{formatDate(p.createdAt)}</span>
              </li>
            ))}

            {stats.payments.length === 0 && requests.length === 0 ? (
              <p className="text-sm text-chalk/50">No payments recorded yet.</p>
            ) : null}
          </ul>
        </div>
      </section>
    </div>
  );
}

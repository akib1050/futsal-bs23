import Link from "next/link";
import { getPlayerBalances, getPoolSummary } from "@/lib/finance";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTk } from "@/lib/format";
import { SectionTitle, Stat, DataTable } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [pool, balances, recentSessions] = await Promise.all([
    getPoolSummary(),
    getPlayerBalances(),
    prisma.session.findMany({
      orderBy: { date: "desc" },
      take: 4,
      include: { players: true, payments: true },
    }),
  ]);

  const prepaidLeft = balances.filter((b) => b.prepaidRemaining > 0);

  return (
    <div className="space-y-10">
      <section className="anim-rise">
        <p className="text-xs uppercase tracking-[0.28em] text-lime/70">
          BS23 · Europe
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-5xl leading-none tracking-wide sm:text-7xl">
          <span className="text-lime">FUTSAL</span>
        </h1>
        <p className="mt-3 max-w-lg text-base text-chalk/65">
          Track turf money, prepaid slots, and who still owes — then split fair
          teams from ratings.
        </p>
      </section>

      <section className="anim-rise-delay-1 grid gap-3 sm:grid-cols-3">
        <Stat
          label="Pool remaining"
          value={formatTk(pool.remaining)}
          hint="Cash left after all turfs"
          accent={pool.remaining >= 0 ? "lime" : "amber"}
        />
        <Stat
          label="Total collected"
          value={formatTk(pool.totalIn)}
          hint={`${pool.playerCount} active players`}
          accent="chalk"
        />
        <Stat
          label="Turf spent"
          value={formatTk(pool.totalTurf)}
          hint={`${pool.sessionCount} sessions`}
          accent="amber"
        />
      </section>

      <section className="anim-rise-delay-2 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <SectionTitle
            title="Recent sessions"
            subtitle="Latest Europe slots and collections"
            action={
              <Link
                href="/sessions"
                className="text-sm text-lime hover:underline"
              >
                All sessions →
              </Link>
            }
          />
          <ul className="space-y-3">
            {recentSessions.map((s) => {
              const collected = s.payments.reduce((sum, p) => sum + p.amount, 0);
              return (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium text-chalk">
                      {s.title || "Futsal session"}
                    </p>
                    <p className="text-sm text-chalk/50">
                      {formatDate(s.date)} · {s.players.length} players
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-amber">{formatTk(s.turfCost)}</p>
                    <p className="text-chalk/50">in {formatTk(collected)}</p>
                  </div>
                </li>
              );
            })}
            {recentSessions.length === 0 ? (
              <p className="text-sm text-chalk/50">No sessions yet.</p>
            ) : null}
          </ul>
        </div>

        <div className="card p-5">
          <SectionTitle
            title="Prepaid slots"
            subtitle="Who still has package credit (900 ÷ 3)"
            action={
              <Link
                href="/players"
                className="text-sm text-lime hover:underline"
              >
                Manage →
              </Link>
            }
          />
          <ul className="space-y-2">
            {prepaidLeft.map((b) => (
              <li
                key={b.playerId}
                className="flex items-center justify-between rounded-lg bg-pitch-deep/50 px-3 py-2"
              >
                <span>{b.name}</span>
                <span className="font-[family-name:var(--font-display)] text-xl text-lime">
                  {b.prepaidRemaining} left
                </span>
              </li>
            ))}
            {prepaidLeft.length === 0 ? (
              <p className="text-sm text-chalk/50">
                No prepaid credits remaining.
              </p>
            ) : null}
          </ul>
        </div>
      </section>

      <section className="card p-5">
        <SectionTitle
          title="Player money"
          subtitle="Paid in, charged at 300 ৳ per session, and what each player has left or owes"
        />
        <DataTable minWidth="560px">
          <thead className="text-xs uppercase tracking-wider text-chalk/45">
            <tr>
              <th className="px-4 py-3 font-medium">Player</th>
              <th className="px-4 py-3 font-medium">Rating</th>
              <th className="px-4 py-3 font-medium">Paid</th>
              <th className="px-4 py-3 font-medium">Played</th>
              <th className="px-4 py-3 font-medium">Charged</th>
              <th className="px-4 py-3 font-medium">Credit / Due</th>
            </tr>
          </thead>
          <tbody>
            {balances.map((b) => (
              <tr key={b.playerId} className="border-t border-line">
                <td className="px-4 py-3">{b.name}</td>
                <td className="px-4 py-3 text-lime">{b.rating.toFixed(1)}</td>
                <td className="px-4 py-3">{formatTk(b.totalPaid)}</td>
                <td className="px-4 py-3">{b.sessionsAttended}</td>
                <td className="px-4 py-3 text-chalk/60">{formatTk(b.charged)}</td>
                <td
                  className={`px-4 py-3 ${
                    b.credit < 0 ? "text-danger" : "text-lime"
                  }`}
                >
                  {b.credit < 0
                    ? `owes ${formatTk(Math.abs(b.credit))}`
                    : formatTk(b.credit)}
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </section>
    </div>
  );
}

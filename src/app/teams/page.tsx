"use client";

import { useEffect, useState } from "react";
import { Button, SectionTitle } from "@/components/ui";

type Player = { id: string; name: string; rating: number; isActive: boolean };

type TeamSplit = {
  teamA: Player[];
  teamB: Player[];
  avgA: number;
  avgB: number;
  diff: number;
};

export default function TeamsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [split, setSplit] = useState<TeamSplit | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then((data: Player[]) => {
        const active = data.filter((p) => p.isActive);
        setPlayers(active);
        const all: Record<string, boolean> = {};
        active.forEach((p) => {
          all[p.id] = true;
        });
        setSelected(all);
      });
  }, []);

  function toggle(id: string) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function makeTeams() {
    const playerIds = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([id]) => id);
    if (playerIds.length < 2) return;
    setLoading(true);
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerIds }),
    });
    const data = await res.json();
    setSplit(data);
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      <SectionTitle
        title="Team maker"
        subtitle="Pick who’s playing — we balance two sides by rating so games stay fair."
      />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((p) => (
          <label
            key={p.id}
            className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 text-sm transition ${
              selected[p.id]
                ? "border-lime/40 bg-lime/10"
                : "border-line bg-pitch/40"
            }`}
          >
            <input
              type="checkbox"
              checked={!!selected[p.id]}
              onChange={() => toggle(p.id)}
            />
            <span className="font-medium">{p.name}</span>
            <span className="ml-auto font-[family-name:var(--font-display)] text-xl text-lime">
              {p.rating}
            </span>
          </label>
        ))}
      </div>

      <Button type="button" onClick={makeTeams} disabled={loading}>
        {loading ? "Balancing…" : "Make 2 balanced teams"}
      </Button>

      {split ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <TeamCard
            name="Team A"
            players={split.teamA}
            avg={split.avgA}
            accent="lime"
          />
          <TeamCard
            name="Team B"
            players={split.teamB}
            avg={split.avgB}
            accent="amber"
          />
          <p className="text-sm text-chalk/55 lg:col-span-2">
            Average gap:{" "}
            <span className="text-chalk">{split.diff.toFixed(2)}</span> rating
            points
          </p>
        </div>
      ) : null}
    </div>
  );
}

function TeamCard({
  name,
  players,
  avg,
  accent,
}: {
  name: string;
  players: { id: string; name: string; rating: number }[];
  avg: number;
  accent: "lime" | "amber";
}) {
  const color = accent === "lime" ? "text-lime" : "text-amber";
  const border =
    accent === "lime" ? "border-lime/30 bg-lime/5" : "border-amber/30 bg-amber/5";

  return (
    <div className={`rounded-xl border p-5 ${border}`}>
      <div className="mb-4 flex items-end justify-between">
        <h2
          className={`font-[family-name:var(--font-display)] text-4xl tracking-wide ${color}`}
        >
          {name}
        </h2>
        <p className="text-sm text-chalk/55">
          avg{" "}
          <span className={`font-[family-name:var(--font-display)] text-2xl ${color}`}>
            {avg.toFixed(2)}
          </span>
        </p>
      </div>
      <ol className="space-y-2">
        {players.map((p, i) => (
          <li
            key={p.id}
            className="flex items-center justify-between border-b border-line pb-2 last:border-0"
          >
            <span>
              <span className="mr-2 text-chalk/40">{i + 1}.</span>
              {p.name}
            </span>
            <span className={color}>{p.rating}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

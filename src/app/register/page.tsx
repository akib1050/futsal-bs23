"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button, Field, inputClass } from "@/components/ui";

type RosterPlayer = { id: string; name: string };

export default function RegisterPage() {
  const router = useRouter();
  const [roster, setRoster] = useState<RosterPlayer[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/roster")
      .then((r) => r.json())
      .then(setRoster)
      .catch(() => setRoster([]));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        phone: phone || null,
        playerId: playerId || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not create your account.");
      setLoading(false);
      return;
    }

    router.push("/me");
    router.refresh();
  }

  return (
    <div className="anim-rise mx-auto mt-8 max-w-md">
      <p className="text-xs uppercase tracking-[0.28em] text-lime/80">
        Join the pool
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-5xl tracking-wide text-chalk">
        Register
      </h1>
      <p className="mt-2 text-sm text-chalk/60">
        Pick your name from the roster so your credit and match history show up right away.
      </p>

      <form
        onSubmit={onSubmit}
        className="glow-lime mt-6 space-y-4 rounded-xl border border-line bg-pitch/50 p-5"
      >
        <Field label="Your name">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            required
          />
        </Field>

        <Field label="Which player are you?">
          <select
            className={inputClass}
            value={playerId}
            onChange={(e) => {
              const id = e.target.value;
              setPlayerId(id);
              const match = roster.find((p) => p.id === id);
              if (match) setName(match.name);
            }}
          >
            <option value="">I&apos;m new — admin will add me</option>
            {roster.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Email">
          <input
            className={inputClass}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>

        <Field label="bKash / phone number (optional)">
          <input
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="017…"
          />
        </Field>

        <Field label="Password (min 6 characters)">
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating…" : "Create account"}
        </Button>

        <p className="text-center text-sm text-chalk/55">
          Already registered?{" "}
          <Link href="/login" className="text-lime hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

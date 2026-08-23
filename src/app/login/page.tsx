"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Button, Field, inputClass } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not sign in.");
      setLoading(false);
      return;
    }

    const data = await res.json();
    const next =
      params.get("next") || (data.role === "ADMIN" ? "/admin" : "/me");
    router.push(next);
    router.refresh();
  }

  return (
    <div className="anim-rise mx-auto mt-8 max-w-md">
      <p className="anim-pulse text-xs uppercase tracking-[0.28em] text-lime/80">
        Futsal BS23
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-5xl tracking-wide text-chalk">
        Sign in
      </h1>
      <p className="mt-2 text-sm text-chalk/60">
        See your credit, stats and pay your turf share.
      </p>

      <form
        onSubmit={onSubmit}
        className="glow-lime mt-6 space-y-4 rounded-xl border border-line bg-pitch/50 p-5"
      >
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
        <Field label="Password">
          <input
            className={inputClass}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>

        <p className="text-center text-sm text-chalk/55">
          New here?{" "}
          <Link href="/register" className="text-lime hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

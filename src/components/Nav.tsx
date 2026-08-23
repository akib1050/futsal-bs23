"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export type NavUser = {
  name: string;
  role: "PLAYER" | "ADMIN";
  isApproved: boolean;
} | null;

const playerLinks = [
  { href: "/me", label: "My card" },
  { href: "/pay", label: "Pay" },
  { href: "/", label: "Pool" },
  { href: "/players", label: "Players" },
  { href: "/sessions", label: "Sessions" },
  { href: "/teams", label: "Teams" },
  { href: "/ledger", label: "Ledger" },
];

export function Nav({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const links = !user
    ? []
    : user.isApproved
      ? user.role === "ADMIN"
        ? [...playerLinks, { href: "/admin", label: "Admin" }]
        : playerLinks
      : [{ href: "/me", label: "My card" }];

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-pitch-deep/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href={user ? "/me" : "/login"} className="flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-display)] text-3xl tracking-wide text-lime">
            BS23
          </span>
          <span className="hidden text-xs uppercase tracking-[0.2em] text-chalk/55 sm:inline">
            Futsal · Europe
          </span>
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-2.5 py-1.5 text-sm transition ${
                  active
                    ? "bg-lime/15 text-lime"
                    : "text-chalk/70 hover:bg-white/5 hover:text-chalk"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {user ? (
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="ml-1 rounded-md border border-line px-2.5 py-1.5 text-sm text-chalk/70 transition hover:bg-white/5 hover:text-chalk disabled:opacity-50"
            >
              {signingOut ? "…" : "Sign out"}
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-lime px-3 py-1.5 text-sm font-medium text-pitch-deep"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

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
    <header className="sticky top-0 z-50 border-b border-line/80 bg-[#06241c]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
        <Link
          href={user ? "/me" : "/login"}
          className="group flex shrink-0 items-baseline gap-2"
        >
          <span className="font-[family-name:var(--font-display)] text-3xl leading-none tracking-wide text-lime transition group-hover:text-lime/90">
            FUTSAL
          </span>
          <span className="text-[0.6rem] font-medium uppercase tracking-[0.2em] text-chalk/45 sm:hidden">
            BS23
          </span>
          <span className="hidden text-[0.65rem] font-medium uppercase tracking-[0.22em] text-chalk/50 sm:inline">
            BS23 · Europe
          </span>
        </Link>

        <nav className="nav-scroll flex max-w-[min(100%,42rem)] flex-nowrap items-center justify-end gap-0.5 overflow-x-auto sm:max-w-none sm:flex-wrap sm:gap-1">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap transition ${
                  active
                    ? "border border-lime/20 bg-lime/10 font-medium text-chalk"
                    : "text-chalk/60 hover:border hover:border-line hover:bg-chalk/5 hover:text-chalk/85"
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
              className="ml-1 shrink-0 rounded-md border border-line px-2.5 py-1.5 text-sm whitespace-nowrap text-chalk/60 transition hover:bg-white/5 hover:text-chalk disabled:opacity-50"
            >
              {signingOut ? "…" : "Sign out"}
            </button>
          ) : (
            <Link
              href="/login"
              className="shrink-0 rounded-md border border-lime/22 bg-lime/10 px-3 py-1.5 text-sm font-medium whitespace-nowrap text-chalk hover:border-lime/30 hover:bg-lime/16"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

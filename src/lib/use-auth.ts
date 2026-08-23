"use client";

import { useEffect, useState } from "react";

export type ClientUser = {
  id: string;
  email: string;
  name: string;
  role: "PLAYER" | "ADMIN";
  isApproved: boolean;
  playerId: string | null;
};

export function useAuth() {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return {
    user,
    loading,
    isAdmin: user?.role === "ADMIN",
  };
}

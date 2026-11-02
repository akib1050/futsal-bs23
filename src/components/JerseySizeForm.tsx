"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import { JERSEY_SIZES } from "@/lib/jersey";

export function JerseySizeForm({
  initialSize,
}: {
  initialSize: string | null;
}) {
  const router = useRouter();
  const [jerseySize, setJerseySize] = useState(initialSize ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function onSave() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jerseySize: jerseySize ? jerseySize : null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Could not save jersey size.");
      return;
    }
    setMessage("Jersey size saved.");
    router.refresh();
  }

  return (
    <div className="card space-y-3 p-5">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-wide">
          Jersey size
        </h2>
        <p className="mt-1 text-sm text-chalk/60">
          Pick your kit size so admin can order the right jerseys.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Size">
          <select
            className={`${inputClass} w-36`}
            value={jerseySize}
            onChange={(e) => setJerseySize(e.target.value)}
          >
            <option value="">Not set</option>
            {JERSEY_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </Field>
        <Button type="button" onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : "Save size"}
        </Button>
      </div>
      {message ? <p className="text-sm text-chalk/65">{message}</p> : null}
    </div>
  );
}

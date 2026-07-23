import { ReactNode } from "react";

export function Stat({
  label,
  value,
  hint,
  accent = "lime",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "lime" | "amber" | "chalk";
}) {
  const color =
    accent === "amber"
      ? "text-amber"
      : accent === "chalk"
        ? "text-chalk"
        : "text-lime";

  return (
    <div className="glow-lime rounded-xl border border-line bg-pitch/60 p-4 sm:p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-chalk/50">{label}</p>
      <p
        className={`mt-2 font-[family-name:var(--font-display)] text-4xl sm:text-5xl ${color}`}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 text-sm text-chalk/55">{hint}</p> : null}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-wide text-chalk sm:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 max-w-xl text-sm text-chalk/60">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  const styles =
    variant === "primary"
      ? "bg-lime text-pitch-deep hover:bg-lime/90"
      : variant === "danger"
        ? "bg-danger/20 text-danger hover:bg-danger/30"
        : "border border-line bg-white/5 text-chalk hover:bg-white/10";

  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs uppercase tracking-[0.14em] text-chalk/50">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-line bg-pitch-deep/80 px-3 py-2 text-chalk outline-none ring-lime/40 placeholder:text-chalk/35 focus:ring-2";

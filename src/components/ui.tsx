import { ReactNode } from "react";

export const cardClass = "card p-4 sm:p-5";
export const cardAccentClass = "card card-accent p-4 sm:p-5";
export const tableWrapClass = "table-wrap";
export const inputClass =
  "w-full rounded-md border border-line bg-pitch-deep/90 px-3 py-2 text-chalk outline-none ring-lime/25 placeholder:text-chalk/35 focus:border-lime/25 focus:ring-2 focus:ring-lime/15";

export const chipClass =
  "flex cursor-pointer items-center gap-2 rounded-md border border-line bg-pitch-deep/40 px-3 py-2 text-sm transition hover:border-chalk/15 hover:bg-chalk/5";
export const chipSelectedClass = "chip-selected";
export const tabClass = "btn-tab px-3 py-2 text-sm";
export const tabActiveClass = "btn-tab btn-tab-active px-3 py-2 text-sm";

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
    <div className={cardClass}>
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
      ? "border border-lime/22 bg-lime/10 text-chalk hover:border-lime/30 hover:bg-lime/16"
      : variant === "danger"
        ? "border border-danger/25 bg-danger/10 text-danger/90 hover:bg-danger/16"
        : "border border-line bg-pitch-deep/40 text-chalk/75 hover:border-chalk/15 hover:bg-chalk/5 hover:text-chalk";

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

export function TabButton({
  active,
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={`${active ? tabActiveClass : tabClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function StatusPill({ status }: { status: string }) {
  const styles =
    status === "APPROVED"
      ? "border border-lime/20 bg-lime/10 text-chalk/90"
      : status === "REJECTED"
        ? "bg-danger/15 text-danger"
        : "bg-amber/15 text-amber";

  return (
    <span
      className={`rounded-md px-2 py-1 text-xs uppercase tracking-wide ${styles}`}
    >
      {status.toLowerCase()}
    </span>
  );
}

export function DataTable({
  children,
  minWidth = "560px",
}: {
  children: ReactNode;
  minWidth?: string;
}) {
  return (
    <div className={tableWrapClass}>
      <table className="text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

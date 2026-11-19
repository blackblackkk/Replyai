import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function Mark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 font-display text-lg font-semibold tracking-normal text-fg">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden="true">
        <rect width="32" height="32" rx="9" className="fill-primary" />
        <path
          d="M11 13.5 8 17l3 3.5M8 17h10.2a4.2 4.2 0 0 0 0-8.4H16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="text-primary-fg"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {compact ? "REPLY" : "REPLY"}
    </span>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "quiet" }) {
  const look =
    variant === "primary"
      ? "bg-primary text-primary-fg hover:opacity-90"
      : variant === "ghost"
        ? "border border-line bg-transparent text-fg hover:bg-raised"
        : "border border-line bg-raised text-fg hover:border-accent";
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${look} ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-muted">{label}</span>
      <input
        className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-fg outline-none focus:border-primary"
        {...props}
      />
    </label>
  );
}

export function Area({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-muted">{label}</span>
      <textarea
        className="min-h-28 w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-fg outline-none focus:border-primary"
        {...props}
      />
    </label>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-surface p-5 ${className}`}>{children}</section>;
}

export function PageTitle({ kicker, title, text }: { kicker?: string; title: string; text?: string }) {
  return (
    <header className="mb-6 max-w-2xl">
      {kicker ? <p className="mb-2 text-sm text-accent">{kicker}</p> : null}
      <h1 className="font-display text-3xl font-semibold text-fg">{title}</h1>
      {text ? <p className="mt-2 text-muted">{text}</p> : null}
    </header>
  );
}

export function Status({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-medium ${ok ? "border-accent text-accent" : "border-line text-muted"}`}
    >
      {children}
    </span>
  );
}

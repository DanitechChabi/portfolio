"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

/** Primitives de formulaire partagées par l'interface admin. */

export const inputClass =
  "w-full rounded-xl border border-line bg-bg/70 px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint/60 transition-colors focus:border-accent/60 focus:outline-none disabled:opacity-50";

export function Field({
  label,
  hint,
  required,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

export function TextInput({
  label,
  hint,
  required,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} required={required} className={className}>
      <input required={required} {...props} className={inputClass} />
    </Field>
  );
}

export function TextArea({
  label,
  hint,
  required,
  rows = 5,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} required={required} className={className}>
      <textarea required={required} rows={rows} {...props} className={inputClass} />
    </Field>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-bg/50 px-4 py-3.5">
      <div>
        <p className="text-sm text-ink">{label}</p>
        {description && <p className="mt-0.5 text-xs text-ink-faint">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
          checked ? "bg-accent" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-bg-deep transition-transform duration-300 ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export function SubmitButton({
  loading,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading || props.disabled}
      className="inline-flex items-center gap-2.5 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-bg-deep transition-all duration-300 hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg-deep/30 border-t-bg-deep" />
      )}
      {children}
    </button>
  );
}

export function DangerButton({
  loading,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      type="button"
      disabled={loading || props.disabled}
      className="inline-flex items-center gap-2 rounded-full border border-red-800/50 px-5 py-2.5 text-sm text-red-800 transition-colors duration-300 hover:border-red-700 hover:bg-red-900/5 disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-800/30 border-t-red-700" />
      )}
      {children}
    </button>
  );
}

export function AdminHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-2xl tracking-tight text-ink md:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-2 text-sm text-ink-dim">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-line bg-surface/60 ${className}`}>
      {children}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      className="rounded-xl border border-red-800/40 bg-red-900/5 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      {message}
    </p>
  );
}

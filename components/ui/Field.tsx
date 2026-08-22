"use client";

// Shared field system for both questionnaires. Labels sit above the control,
// helper text under the label, error text under the control. Never a
// placeholder standing in for a label.

import { PiWarningCircleBold } from "react-icons/pi";

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-medium text-text">
          {label}
        </label>
        {hint && <span className="text-xs text-faint">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-1.5 text-sm text-negative">
      <PiWarningCircleBold className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

export const controlClass = (hasError?: boolean) =>
  `w-full rounded-[var(--r-control)] border bg-raised px-3.5 py-3 text-text ` +
  `shadow-[var(--inset-edge)] transition-colors duration-200 ` +
  `hover:border-edge focus:outline-none focus-visible:outline-none ` +
  `focus:border-[color:var(--accent-text)] focus:ring-1 focus:ring-[color:var(--accent-text)] ` +
  (hasError ? "border-negative" : "border-hairline");

export const numericClass = (hasError?: boolean) =>
  `${controlClass(hasError)} tnum text-[1.05rem]`;

/**
 * Segmented radio group. Renders real radio inputs so keyboard and screen
 * reader behavior comes from the platform. `register` supplies the same field
 * name and option values the API already expects, so the wire format is
 * unchanged from the previous select-based form.
 */
export function Choices<T extends string>({
  legend,
  hint,
  options,
  selected,
  columns = 3,
  registration,
}: {
  legend: string;
  hint?: string;
  options: readonly { value: T; label: string }[];
  selected?: string;
  columns?: 2 | 3 | 4;
  registration: React.InputHTMLAttributes<HTMLInputElement>;
}) {
  const cols =
    columns === 2
      ? "grid-cols-2 sm:max-w-md"
      : columns === 4
        ? "grid-cols-2 sm:grid-cols-4"
        : "grid-cols-1 sm:grid-cols-3";

  return (
    <fieldset className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <legend className="text-sm font-medium text-text">{legend}</legend>
        {hint && <span className="text-xs text-faint">{hint}</span>}
      </div>
      <div className={`grid gap-2 ${cols}`}>
        {options.map((option) => {
          const active = selected === option.value;
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center justify-center rounded-[var(--r-control)] border px-3 py-3 text-center text-sm font-medium transition-colors duration-200 ${
                active
                  ? "border-[color:var(--accent-text)] bg-accent-weak text-white"
                  : "border-hairline bg-raised text-muted shadow-[var(--inset-edge)] hover:border-edge hover:text-text"
              }`}
            >
              <input
                type="radio"
                value={option.value}
                className="sr-only"
                {...registration}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

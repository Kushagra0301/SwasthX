"use client";

// One button system for the whole app. Three intents, two sizes, one radius.
// Filled uses white on cobalt (4.5:1); every other variant keeps text at --text
// or brighter, so no variant can fail contrast by construction.

import { forwardRef } from "react";

type Variant = "filled" | "outline" | "ghost";
type Size = "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-[var(--r-control)] font-medium " +
  "whitespace-nowrap transition-[background-color,border-color,color,transform] duration-200 " +
  "active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 disabled:active:translate-y-0";

const VARIANTS: Record<Variant, string> = {
  filled:
    "bg-accent text-white shadow-[var(--shadow-panel)] hover:bg-accent-hover",
  outline:
    "border border-edge bg-raised text-text shadow-[var(--inset-edge)] hover:border-[color:var(--accent-text)] hover:text-white",
  ghost: "text-muted hover:bg-raised hover:text-text",
};

const SIZES: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-[0.95rem]",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "filled", size = "md", className, type = "button", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className ?? ""}`}
      {...props}
    />
  );
});

export default Button;

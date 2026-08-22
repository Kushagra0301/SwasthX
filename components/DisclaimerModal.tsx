"use client";

import { useEffect, useRef } from "react";
import { PiXBold } from "react-icons/pi";
import { useScrollLock } from "@/lib/useScrollLock";
import Button from "@/components/ui/Button";

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const POINTS = [
  {
    term: "Not medical advice",
    detail:
      "These plans are not a substitute for professional diagnosis or treatment.",
  },
  {
    term: "Consult a professional",
    detail:
      "Check with a doctor, dietitian or trainer before you start, particularly if you are managing a condition.",
  },
  {
    term: "Your responsibility",
    detail:
      "You decide what to follow. SwasthX is not liable for injury or health issues arising from these plans.",
  },
  {
    term: "Results vary",
    detail:
      "Genetics, sleep, stress and consistency all move the outcome, and none of them are inputs on the form.",
  },
];

export default function DisclaimerModal({
  isOpen,
  onClose,
  onAccept,
}: DisclaimerModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const firstFocusable = dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="animate-fade fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
    >
      <div
        className="absolute inset-0 bg-ink/85 backdrop-blur-md"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        className="animate-rise relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-[var(--r-panel)] border border-edge bg-surface shadow-[var(--shadow-lift)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-7 py-6">
          <div>
            <h2
              id="disclaimer-title"
              className="display-4"
            >
              Read this first
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              SwasthX gives information, not treatment.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-m-1.5 rounded-[var(--r-control)] p-1.5 text-faint transition-colors hover:bg-raised hover:text-text"
          >
            <PiXBold className="text-lg" />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain px-7 py-6">
          <dl className="flex flex-col">
            {POINTS.map((point) => (
              <div
                key={point.term}
                className="border-b border-hairline py-4 first:pt-0 last:border-b-0 last:pb-0"
              >
                <dt className="text-sm font-medium text-text">{point.term}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-muted">
                  {point.detail}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-col gap-3 border-t border-hairline px-7 py-6">
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Button variant="ghost" size="lg" onClick={onClose} className="sm:flex-1">
              Go back
            </Button>
            <Button size="lg" onClick={onAccept} className="sm:flex-1">
              I understand, continue
            </Button>
          </div>
          <p className="text-center text-xs leading-relaxed text-faint">
            Continuing means you have read this and accept it.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { FiAlertTriangle, FiInfo, FiX } from "react-icons/fi";
import { useScrollLock } from "@/lib/useScrollLock";

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function DisclaimerModal({ isOpen, onClose, onAccept }: DisclaimerModalProps) {
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

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
    >
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={onClose} />

      <div
        ref={dialogRef}
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-surface shadow-2xl animate-slide-up"
      >
        <div className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur-md p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-danger/15">
              <FiAlertTriangle className="text-lg text-danger" aria-hidden="true" />
            </div>
            <div>
              <h3 id="disclaimer-title" className="font-display text-xl font-semibold text-text">
                Before you continue
              </h3>
              <p className="mt-1 text-sm text-text-muted">Please read this quick disclaimer</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <p className="text-center text-text-muted">
            <span className="font-semibold text-text">SwasthX</span> provides fitness and diet plans for
            informational purposes only.
          </p>

          <div className="rounded-xl border border-border bg-ink/40 p-4">
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-danger" aria-hidden="true">&bull;</span>
                <span className="text-text-muted">
                  <span className="font-medium text-text">Not medical advice:</span> these plans are not a
                  substitute for professional medical advice, diagnosis, or treatment.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-danger" aria-hidden="true">&bull;</span>
                <span className="text-text-muted">
                  <span className="font-medium text-text">No responsibility:</span> SwasthX does not take
                  responsibility for any injuries, health issues, or damages resulting from following these
                  plans.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-danger" aria-hidden="true">&bull;</span>
                <span className="text-text-muted">
                  <span className="font-medium text-text">Consult professionals:</span> always check with a
                  qualified healthcare provider, nutritionist, or trainer before starting a new program.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-danger" aria-hidden="true">&bull;</span>
                <span className="text-text-muted">
                  <span className="font-medium text-text">Your responsibility:</span> you are solely
                  responsible for your health, safety, and well-being when using these plans.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-danger" aria-hidden="true">&bull;</span>
                <span className="text-text-muted">
                  <span className="font-medium text-text">Results vary:</span> outcomes depend on genetics,
                  consistency, diet, and overall health.
                </span>
              </li>
            </ul>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/10 p-4">
            <FiInfo className="mt-0.5 flex-shrink-0 text-lg text-accent" aria-hidden="true" />
            <div>
              <p className="mb-1 text-sm font-medium text-text">Good to know</p>
              <p className="text-sm text-text-muted">
                These plans offer general guidance. What works for one person may not work for another -
                listen to your body and adjust as needed.
              </p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-border bg-surface/95 backdrop-blur-md p-6 pt-4">
          <div className="flex flex-col gap-3">
            <button
              onClick={onAccept}
              className="rounded-xl bg-accent px-4 py-3 font-medium text-ink transition-colors hover:bg-accent-hover"
            >
              I Understand &amp; Accept
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-3 font-medium text-text-muted transition-colors hover:border-text-muted hover:text-text"
            >
              Cancel
            </button>
            <p className="pt-2 text-center text-xs text-text-muted">
              By continuing, you acknowledge that you have read and agree to this disclaimer.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 rounded-lg p-1 text-text-muted transition-colors hover:bg-ink/40 hover:text-text"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

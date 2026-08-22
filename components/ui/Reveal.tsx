"use client";

// Scroll-triggered entrance built on a plain IntersectionObserver: no scroll
// listener, no per-frame work, and no dependency on a library's viewport
// heuristics. Only transform and opacity are animated, both compositable.
// Reduced-motion visitors are handed the resting state at mount.

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

export default function Reveal({
  children,
  delay = 0,
  y = 14,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (reduce) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -5% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [reduce]);

  const active = shown || reduce;

  return (
    <Tag
      ref={ref as never}
      className={className}
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "none" : `translateY(${y}px)`,
        transition: reduce
          ? undefined
          : `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
        willChange: active ? undefined : "opacity, transform",
      }}
    >
      {children}
    </Tag>
  );
}

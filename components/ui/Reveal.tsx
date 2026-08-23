"use client";

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
    if (reduce) return;
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
      // The root is extended far above the viewport so anything already
      // scrolled past counts as intersecting. Without it, a jump scroll
      // (anchor link, Ctrl+End) strands skipped content at opacity 0.
      { threshold: 0.15, rootMargin: "10000px 0px -5% 0px" }
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

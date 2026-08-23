"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

export default function Counter({
  value,
  duration = 900,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (reduce) return;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Exponential ease-out: fast arrival, soft settle.
      const eased = 1 - Math.pow(2, -10 * t);
      setShown(Math.round(value * (t === 1 ? 1 : eased)));
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    };
  }, [value, duration, reduce]);

  return (
    <span className={`tnum ${className ?? ""}`}>
      {(reduce ? value : shown).toLocaleString()}
    </span>
  );
}

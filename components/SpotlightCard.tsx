"use client";

import { useRef } from "react";

export default function SpotlightCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const glow = glowRef.current;
    if (!glow) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    glow.style.background = `radial-gradient(220px circle at ${x}px ${y}px, rgba(224,224,224,0.08), transparent 70%)`;
  };

  const handleMouseLeave = () => {
    if (glowRef.current) glowRef.current.style.background = "transparent";
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden ${className ?? ""}`}
    >
      <div ref={glowRef} className="pointer-events-none absolute inset-0 transition-[background] duration-300" />
      <div className="relative">{children}</div>
    </div>
  );
}

"use client";

// SVG textPath marquee that scrolls along a gentle curve. Adapted from
// ReactBits' "Curved Loop" component (https://reactbits.dev) - no external
// dependencies, restyled to this app's monochrome design tokens.

import { useRef, useEffect, useState, useMemo, useId } from "react";

export default function CurvedLoop({
  marqueeText = "",
  speed = 1,
  curveAmount = 200,
  className,
}: {
  marqueeText?: string;
  speed?: number;
  curveAmount?: number;
  className?: string;
}) {
  const text = useMemo(() => {
    const hasTrailing = /\s| $/.test(marqueeText);
    return (hasTrailing ? marqueeText.replace(/\s+$/, "") : marqueeText) + " ";
  }, [marqueeText]);

  const measureRef = useRef<SVGTextElement>(null);
  const textPathRef = useRef<SVGTextPathElement>(null);
  const [spacing, setSpacing] = useState(0);
  const [offset, setOffset] = useState(0);
  const uid = useId();
  const pathId = `curve-${uid}`;
  const pathD = `M-100,40 Q500,${40 + curveAmount} 1540,40`;

  const totalText = spacing
    ? Array(Math.ceil(1800 / spacing) + 2)
        .fill(text)
        .join("")
    : text;
  const ready = spacing > 0;

  useEffect(() => {
    if (measureRef.current) setSpacing(measureRef.current.getComputedTextLength());
  }, [text]);

  useEffect(() => {
    if (!spacing || !textPathRef.current) return;
    const initial = -spacing;
    textPathRef.current.setAttribute("startOffset", initial + "px");
    setOffset(initial);
  }, [spacing]);

  useEffect(() => {
    if (!spacing || !ready) return;
    let frame = 0;
    const step = () => {
      if (textPathRef.current) {
        const currentOffset = parseFloat(textPathRef.current.getAttribute("startOffset") || "0");
        let newOffset = currentOffset - speed;
        if (newOffset <= -spacing) newOffset += spacing;
        textPathRef.current.setAttribute("startOffset", newOffset + "px");
        setOffset(newOffset);
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [spacing, speed, ready]);

  return (
    <div className="w-full select-none" style={{ visibility: ready ? "visible" : "hidden" }}>
      <svg className="w-full" viewBox="0 0 1440 120" style={{ overflow: "visible" }}>
        <text ref={measureRef} xmlSpace="preserve" style={{ visibility: "hidden", opacity: 0 }}>
          {text}
        </text>
        <defs>
          <path id={pathId} d={pathD} fill="none" stroke="transparent" />
        </defs>
        {ready && (
          <text
            fontWeight="700"
            xmlSpace="preserve"
            className={`fill-current uppercase tracking-tight ${className ?? ""}`}
            style={{ fontSize: "4rem" }}
          >
            <textPath ref={textPathRef} href={`#${pathId}`} startOffset={offset + "px"} xmlSpace="preserve">
              {totalText}
            </textPath>
          </text>
        )}
      </svg>
    </div>
  );
}

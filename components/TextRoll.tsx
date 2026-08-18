"use client";

// Two-layer per-character hover roll: the resting label slides up out of
// view while an identical duplicate slides up into its place, staggered
// character-by-character. Technique adapted from Skiper UI's "Text Roll"
// component (https://skiper-ui.com), reimplemented here without its
// dependency on the Skiper UI package.

import { motion } from "framer-motion";

const STAGGER = 0.025;

export default function TextRoll({
  children,
  className,
  center = false,
}: {
  children: string;
  className?: string;
  center?: boolean;
}) {
  const letters = children.split("");

  return (
    <motion.span
      initial="initial"
      whileHover="hovered"
      className={`relative inline-block overflow-hidden ${className ?? ""}`}
      style={{ lineHeight: 1 }}
    >
      <span className="block">
        {letters.map((letter, i) => {
          const delay = center ? STAGGER * Math.abs(i - (letters.length - 1) / 2) : STAGGER * i;
          return (
            <motion.span
              key={i}
              className="inline-block"
              variants={{ initial: { y: 0 }, hovered: { y: "-100%" } }}
              transition={{ ease: "easeInOut", duration: 0.4, delay }}
            >
              {letter === " " ? " " : letter}
            </motion.span>
          );
        })}
      </span>
      <span className="absolute inset-0">
        {letters.map((letter, i) => {
          const delay = center ? STAGGER * Math.abs(i - (letters.length - 1) / 2) : STAGGER * i;
          return (
            <motion.span
              key={i}
              className="inline-block"
              variants={{ initial: { y: "100%" }, hovered: { y: 0 } }}
              transition={{ ease: "easeInOut", duration: 0.4, delay }}
            >
              {letter === " " ? " " : letter}
            </motion.span>
          );
        })}
      </span>
    </motion.span>
  );
}

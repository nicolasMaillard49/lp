"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Décalage vertical de départ (px). */
  y?: number;
  /** Délai avant l'entrée (s) — sert à staggerer manuellement. */
  delay?: number;
  as?: "div" | "section" | "li" | "figure";
};

/**
 * Révèle son contenu à l'entrée dans le viewport (une seule fois).
 * Respecte prefers-reduced-motion : simple fondu, sans translation.
 */
export function Reveal({
  children,
  className,
  y = 18,
  delay = 0,
  as = "div",
}: RevealProps) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </MotionTag>
  );
}

"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Fond "aurora" : 3 nappes de couleur floutées qui dérivent lentement.
 * Donne de la profondeur et de la vie sans charger le rendu (transform/opacity).
 */
export function Aurora() {
  const reduce = useReducedMotion();

  const blobs = [
    {
      className:
        "left-[8%] top-[12%] size-[42vmax] bg-[oklch(0.83_0.155_78/0.5)]",
      anim: { x: [0, 40, -10, 0], y: [0, -30, 20, 0], scale: [1, 1.12, 0.96, 1] },
      dur: 18,
    },
    {
      className:
        "right-[6%] top-[24%] size-[38vmax] bg-[oklch(0.67_0.15_64/0.42)]",
      anim: { x: [0, -50, 20, 0], y: [0, 30, -20, 0], scale: [1, 0.92, 1.1, 1] },
      dur: 22,
    },
    {
      className:
        "left-[32%] bottom-[2%] size-[34vmax] bg-[oklch(0.6_0.14_45/0.32)]",
      anim: { x: [0, 30, -30, 0], y: [0, -20, 10, 0], scale: [1, 1.08, 0.95, 1] },
      dur: 26,
    },
  ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-[80px] ${b.className}`}
          animate={reduce ? undefined : b.anim}
          transition={{
            duration: b.dur,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

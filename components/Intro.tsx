"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

/**
 * Rideau ambré au chargement : un voile se lève et révèle la page,
 * le logo « NMF. » se dessine. Joue une seule fois, jamais en reduced-motion.
 */
export function Intro() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (reduce) {
      setOpen(true);
      return;
    }
    const t = setTimeout(() => setOpen(true), 400);
    return () => clearTimeout(t);
  }, [reduce]);

  if (reduce) return null;

  return (
    <AnimatePresence>
      {!open && (
        <motion.div
          key="intro"
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
        >
          {/* fond ambré drenched */}
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(150deg,oklch(0.72_0.155_67),oklch(0.55_0.15_50))]"
          />
          <div
            aria-hidden
            className="absolute -top-24 left-1/2 size-[80vmin] -translate-x-1/2 rounded-full bg-[oklch(0.88_0.14_88/0.5)] blur-3xl"
          />

          <div className="relative flex flex-col items-center gap-2">
            <motion.span
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
              className="font-display text-5xl font-medium text-white sm:text-6xl"
            >
              NMF<span className="text-[oklch(0.9_0.13_90)]">.</span>
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
              className="text-base font-medium tracking-[0.2em] text-white/85 uppercase sm:text-lg"
            >
              Bienvenue
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

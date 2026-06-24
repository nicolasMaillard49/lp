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
    const t = setTimeout(() => setOpen(true), 950);
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
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
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

          <motion.span
            initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="relative font-display text-5xl font-medium text-white sm:text-6xl"
          >
            NMF<span className="text-[oklch(0.9_0.13_90)]">.</span>
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

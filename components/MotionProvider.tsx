"use client";

import { LazyMotion, domAnimation } from "motion/react";
import type { ReactNode } from "react";

/**
 * Charge le sous-ensemble d'animations DOM de motion (LazyMotion) pour
 * les composants qui utilisent `m.*` au lieu de `motion.*` — ça retire
 * le moteur complet du bundle des pages qui n'importent que `m`.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}

"use client";

import { useMotionValue, useSpring, useReducedMotion } from "motion/react";

/**
 * Inclinaison 3D vers le curseur. À étaler sur un élément motion :
 *   const tilt = useTilt();
 *   <motion.div {...tilt.handlers} style={tilt.style} />
 */
export function useTilt(max = 8) {
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 200, damping: 20, mass: 0.5 });
  const rotateY = useSpring(ry, { stiffness: 200, damping: 20, mass: 0.5 });

  function onMouseMove(e: React.MouseEvent<HTMLElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    rx.set((0.5 - py) * 2 * max);
    ry.set((px - 0.5) * 2 * max);
  }
  function onMouseLeave() {
    rx.set(0);
    ry.set(0);
  }

  return {
    handlers: { onMouseMove, onMouseLeave },
    style: { rotateX, rotateY, transformPerspective: 900 },
  };
}

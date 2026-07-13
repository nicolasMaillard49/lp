"use client";

import { useEffect, useState } from "react";

/**
 * Rideau d'ouverture de la LP R2 — version CSS pure : rendu dans le HTML
 * serveur, il s'anime dès le premier paint (aucune attente d'hydratation,
 * le LCP du hero n'est pas retardé) puis se démonte. Masqué en
 * prefers-reduced-motion via la classe .curtain.
 */
export function IntroR2() {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    // 1s de pause + 0.55s de sortie (cf. .curtain dans globals.css)
    const t = setTimeout(() => setGone(true), 1700);
    return () => clearTimeout(t);
  }, []);

  if (gone) return null;

  return (
    <div
      aria-hidden
      className="curtain pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
    >
      {/* fond nuit ambrée — plus grave que le rideau de bienvenue */}
      <div className="absolute inset-0 bg-[linear-gradient(150deg,oklch(0.32_0.05_55),oklch(0.22_0.03_265))]" />
      <div className="absolute -top-24 left-1/2 size-[80vmin] -translate-x-1/2 rounded-full bg-[oklch(0.72_0.155_67/0.35)] blur-3xl" />

      <div className="relative flex flex-col items-center gap-2">
        <span
          className="curtain-item font-display text-5xl font-medium text-white sm:text-6xl"
          style={{ animationDelay: "0.05s" }}
        >
          NMF<span className="text-[oklch(0.9_0.13_90)]">.</span>
        </span>
        <span
          className="curtain-item text-base font-medium uppercase tracking-[0.2em] text-white/85 sm:text-lg"
          style={{ animationDelay: "0.18s" }}
        >
          La suite
        </span>
      </div>
    </div>
  );
}

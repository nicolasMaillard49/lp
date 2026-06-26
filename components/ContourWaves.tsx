"use client";

import { useEffect, useRef } from "react";
import { animate, createTimeline, stagger, svg } from "animejs";

/**
 * Courbes de niveau « carte topographique » autour du lecteur vidéo.
 * Chaque anneau est un tracé organique (pas un cercle) que anime.js fait
 * morpher en continu entre plusieurs formes — l'ondulation du relief — pendant
 * qu'il irradie vers l'extérieur. Le trait reste d'épaisseur constante
 * (non-scaling-stroke) pour le rendu « ligne de niveau ».
 */

const CX = 120;
const CY = 174; // centre d'émission abaissé, au niveau du lecteur vidéo
const N = 7; // points d'ancrage du tracé
const BASE = 66; // rayon de base

/** Construit un tracé fermé et lisse (spline Catmull-Rom) à partir de N rayons. */
function blob(radii: number[]): string {
  const pts = radii.map((rad, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    return [CX + Math.cos(a) * rad, CY + Math.sin(a) * rad] as const;
  });
  const p = (i: number) => pts[((i % N) + N) % N];
  let d = `M${p(0)[0].toFixed(1)} ${p(0)[1].toFixed(1)}`;
  for (let i = 0; i < N; i++) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return `${d}Z`;
}

// Quelques formes organiques entre lesquelles les anneaux vont morpher.
const SHAPES = [
  [1.0, 0.84, 1.1, 0.88, 1.06, 0.8, 1.02],
  [0.88, 1.08, 0.82, 1.12, 0.86, 1.05, 0.9],
  [1.08, 0.9, 1.0, 0.84, 1.12, 0.94, 0.86],
].map((m) => blob(m.map((k) => k * BASE)));

const RINGS = 10;

export function ContourWaves() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const paths = Array.from(
      root.querySelectorAll<SVGPathElement>("path[data-ring]"),
    );
    const tpl = (n: number) =>
      root.querySelector<SVGPathElement>(`path[data-shape="${n}"]`)!;

    // Irradiation continue : les anneaux sont répartis pile sur la durée
    // (stagger = duration / RINGS) pour qu'une onde reparte au moment où la
    // précédente s'éteint — aucun temps mort. Amplitude large pour buter sur
    // les quatre bords malgré le centre abaissé.
    const radiate = animate(paths, {
      scale: [0.28, 3.1],
      // Fondu d'apparition au centre, puis pleine opacité tout le long, et
      // disparition seulement en toute fin de course (près des bords) → aucune
      // naissance visible ET aucune bande vide entre les ondes.
      opacity: [0, 0.85, 0.85, 0.85, 0.85, 0],
      rotate: [-6, 8],
      duration: 5400,
      delay: stagger(5400 / RINGS),
      loop: true,
      ease: "linear",
    });

    // Morphing : la forme ondule en continu, chaque anneau déphasé (durée
    // légèrement différente pour qu'ils se désynchronisent avec le temps).
    const morphs = paths.map((path, i) => {
      const tl = createTimeline({
        loop: true,
        defaults: { ease: "inOutSine", duration: 2300 + i * 170 },
      });
      tl.add(path, { d: svg.morphTo(tpl(1)) })
        .add(path, { d: svg.morphTo(tpl(2)) })
        .add(path, { d: svg.morphTo(tpl(0)) });
      return tl;
    });

    return () => {
      radiate.revert();
      morphs.forEach((m) => m.revert());
    };
  }, []);

  return (
    <svg
      ref={ref}
      aria-hidden
      viewBox="0 0 240 240"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full overflow-visible"
    >
      {/* Formes de référence (invisibles) vers lesquelles on morphe. */}
      {SHAPES.map((d, i) => (
        <path key={`tpl-${i}`} data-shape={i} d={d} fill="none" stroke="none" />
      ))}

      {/* Anneaux animés. */}
      {Array.from({ length: RINGS }).map((_, i) => (
        <path
          key={`ring-${i}`}
          data-ring
          d={SHAPES[0]}
          fill="none"
          stroke="oklch(0.5 0.2 258 / 0.3)"
          strokeWidth={2.5}
          vectorEffect="non-scaling-stroke"
          style={{
            transformBox: "fill-box",
            transformOrigin: "center",
            opacity: 0,
          }}
        />
      ))}
    </svg>
  );
}

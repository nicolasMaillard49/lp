/**
 * Courbes de niveau « carte topographique » autour du lecteur vidéo.
 *
 * Version STATIQUE : des anneaux concentriques fixes, rendus une seule fois
 * côté serveur. Aucune animation, aucun JavaScript envoyé au client, aucune
 * dépendance (anime.js retiré). Le rendu « ligne de niveau » est conservé
 * grâce au trait d'épaisseur constante (non-scaling-stroke).
 */

const CX = 120;
const CY = 174; // centre d'émission au niveau du lecteur vidéo
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

// Trois signatures organiques réutilisées d'un anneau à l'autre pour le relief.
const SHAPES = [
  [1.0, 0.84, 1.1, 0.88, 1.06, 0.8, 1.02],
  [0.88, 1.08, 0.82, 1.12, 0.86, 1.05, 0.9],
  [1.08, 0.9, 1.0, 0.84, 1.12, 0.94, 0.86],
];

const RINGS = 11;

// Anneaux concentriques figés : rayon croissant (bute sur les quatre bords),
// opacité décroissante vers l'extérieur — l'ondulation du relief, immobile.
const CONTOURS = Array.from({ length: RINGS }, (_, i) => {
  const t = i / (RINGS - 1); // 0 (centre) → 1 (bords)
  const scale = 0.5 + t * 2.6; // 0.5 → 3.1
  const shape = SHAPES[i % SHAPES.length];
  const d = blob(shape.map((k) => k * BASE * scale));
  const opacity = +(0.34 * (1 - t) + 0.05).toFixed(3);
  return { d, opacity };
});

export function ContourWaves() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 240 240"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full overflow-visible"
    >
      {CONTOURS.map((c, i) => (
        <path
          key={i}
          d={c.d}
          fill="none"
          stroke={`oklch(0.5 0.2 258 / ${c.opacity})`}
          strokeWidth={2.5}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

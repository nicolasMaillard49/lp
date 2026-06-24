import { site } from "@/config/site";

/**
 * Bandeau défilant des métiers — ancre la page dans le monde artisan
 * et apporte du mouvement continu. Pause au survol.
 */
export function Marquee() {
  const items = [...site.metiers, ...site.metiers];

  return (
    <div className="relative overflow-hidden border-y border-border bg-surface py-5">
      {/* Fondus latéraux */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-bg to-transparent" />

      <div className="marquee-track flex w-max items-center gap-10 whitespace-nowrap">
        {items.map((metier, i) => (
          <span key={i} className="flex items-center gap-10">
            <span className="font-display text-xl font-medium text-ink/80">
              {metier}
            </span>
            <span className="size-1.5 rounded-full bg-primary/60" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
}

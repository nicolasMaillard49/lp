import { site } from "@/config/site";

/**
 * Hero de la LP d'acquisition — composant serveur, aucun JS.
 * Volontairement sobre : le vrai hook de la page, c'est le simulateur
 * juste en dessous. Le hero ne fait que poser la question.
 */
export function LpHero() {
  return (
    <section className="px-5 pb-12 pt-14 sm:px-8 sm:pb-16 sm:pt-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          {site.lp.eyebrow}
        </p>
        <h1 className="mx-auto mt-4 text-balance text-[clamp(1.9rem,5vw,3.2rem)] font-normal leading-tight text-ink">
          {site.lp.title}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty leading-relaxed text-muted">
          {site.lp.subtitle}
        </p>
        <p className="mt-6 text-sm font-medium text-muted">
          {site.lp.reassurance}
        </p>
      </div>
    </section>
  );
}

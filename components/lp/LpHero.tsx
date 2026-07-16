import { site } from "@/config/site";

/**
 * En-tête de la LP d'acquisition — composant serveur, aucun JS.
 * Ce n'est plus un « hero » : juste le titre du simulateur, qui est
 * LA page (épure 2026-07-15). Un titre, une ligne, et l'outil arrive
 * dans le premier écran — tout le reste distrayait du calcul.
 */
export function LpHero() {
  return (
    <header className="px-5 pb-8 pt-12 sm:px-8 sm:pb-10 sm:pt-16">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          {site.lp.eyebrow}
        </p>
        <h1 className="mx-auto mt-3 text-balance text-[clamp(1.7rem,4.2vw,2.6rem)] font-normal leading-tight text-ink">
          {site.lp.title}
        </h1>
        <p className="mx-auto mt-3 text-pretty text-sm leading-relaxed text-muted sm:text-base">
          {site.lp.subtitle} {site.lp.reassurance}.
        </p>
        {/* Preuve unique au-dessus du pli — sobre, mais présente. */}
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
          <svg viewBox="0 0 16 16" className="size-3.5 text-primary" fill="none" aria-hidden>
            <path d="M8 1.5l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.3l-3.8 2 .7-4.3-3.1-3 4.3-.6L8 1.5z" fill="currentColor" />
          </svg>
          {site.lp.proof}
        </p>
      </div>
    </header>
  );
}

import { site } from "@/config/site";

/**
 * En-tête de la LP d'acquisition — composant serveur, aucun JS.
 * Ce n'est plus un « hero » : juste le titre du simulateur, qui est
 * LA page (épure 2026-07-15). Un titre, une ligne, et l'outil arrive
 * dans le premier écran — tout le reste distrayait du calcul.
 */
export function LpHero() {
  return (
    <header className="bg-[#f7f9fc] px-5 pb-8 pt-12 font-helvetica sm:px-8 sm:pb-10 sm:pt-16">
      <div className="mx-auto max-w-6xl">
        <div className="border-2 border-[#071a33] bg-white p-4 text-left font-helvetica sm:p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#075ad8]">
            {site.lp.eyebrow}
          </p>
          <h1 className="mt-2 max-w-3xl font-helvetica text-balance text-[clamp(1.75rem,4vw,3.3rem)] font-black leading-[0.95] tracking-tight text-[#071a33]">
            {site.lp.title}
          </h1>
          <p className="mt-3 max-w-xl text-pretty text-sm font-semibold leading-relaxed text-[#607089]">
            {site.lp.subtitle} {site.lp.reassurance}.
          </p>
        </div>
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

import { site } from "@/config/site";

/**
 * Liste des métiers accompagnés, sur UNE seule ligne horizontale qui
 * occupe toute la largeur (pas d'empilement, pas de scroll). En mobile,
 * les métiers qui débordent sont simplement coupés (overflow hidden).
 */
export function Marquee() {
  return (
    <div className="w-full overflow-hidden border-y border-border bg-surface py-6">
      <ul className="flex w-full flex-nowrap items-center justify-between gap-4 px-5 sm:px-8">
        {site.metiers.map((metier) => (
          <li key={metier} className="flex shrink-0 items-center gap-1.5">
            <span className="font-display text-base font-medium text-ink/85">
              {metier}
            </span>
            <svg
              className="size-4 shrink-0 text-electric"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden
            >
              <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.15" />
              <path
                d="M6.2 10.4 8.7 13l5.1-5.6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </li>
        ))}
      </ul>
    </div>
  );
}

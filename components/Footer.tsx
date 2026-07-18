import { site } from "@/config/site";

/* `helvetica` : les pages simulateur sont 100 % Helvetica Neue,
   le reste du site garde l'identité serif (Fraunces). */
export function Footer({ helvetica = false }: { helvetica?: boolean } = {}) {
  return (
    <footer
      className={`border-t border-border px-5 py-10 sm:px-8 ${helvetica ? "font-helvetica" : ""}`}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted sm:flex-row">
        <span className={`${helvetica ? "font-helvetica font-bold" : "font-display font-semibold"} text-ink`}>
          {site.name}
          <span className="text-primary">.</span>
          <span className={`ml-2 text-sm font-normal text-muted ${helvetica ? "font-helvetica" : "font-sans"}`}>
            {site.founder}
          </span>
        </span>
        <p>© {new Date().getFullYear()} · Tous droits réservés</p>
        <a href="#" className="transition-colors hover:text-ink">
          Mentions légales
        </a>
      </div>
    </footer>
  );
}

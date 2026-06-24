import { site } from "@/config/site";

export function Footer() {
  return (
    <footer className="border-t border-border px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted sm:flex-row">
        <span className="font-display font-semibold text-ink">
          {site.name}
          <span className="text-primary">.</span>
          <span className="ml-2 font-sans text-sm font-normal text-muted">
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

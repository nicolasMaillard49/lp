import { emails } from "@/config/emails";
import {
  C,
  baseUrl,
  button,
  ctaNote,
  esc,
  fmtEuro,
  hero,
  layout,
  ouverture,
  para,
  row,
} from "../layout";

/* #4 et #5 — Relances envoyées par le cron quotidien à ceux qui ont
   laissé leur email sans compléter le formulaire. Snapshot depuis le
   jsonb en base → potentiellement partiel/nul, tout est optionnel.
   Prospection → lien de désinscription obligatoire. */

type LooseSnapshot = Record<string, unknown> | null;

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** Ligne « objet » : ce que le snapshot sait de lui. */
function objetLine(s: LooseSnapshot): string | undefined {
  const parts = [str(s?.metier), str(s?.ville)].filter(Boolean);
  return parts.length ? parts.join(" · ") : undefined;
}

/** Rappel des réglages — seulement ce qui existe dans le snapshot.
    Métier/ville vivent dans la ligne « objet », pas ici. */
function recapRows(s: LooseSnapshot): string {
  if (!s) return "";
  const budget = num(s.budget);
  const ca = num(s.ca);
  const rows = [
    budget !== null ? row("Budget mensuel", esc(fmtEuro(budget))) : "",
    ca !== null ? row("CA estimé / mois", esc(fmtEuro(ca))) : "",
  ].join("");
  return rows
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`
    : "";
}

function unsubUrl(token: string): string {
  return `${baseUrl()}/api/unsub?t=${encodeURIComponent(token)}`;
}

export function relanceJ2Email(args: { snapshot: LooseSnapshot; unsubToken: string }): {
  subject: string;
  html: string;
} {
  const t = emails.relanceJ2;
  const net = num(args.snapshot?.net);
  const subject =
    net !== null && net > 0 ? t.subjectAvecChiffre(fmtEuro(net)) : t.subjectSansChiffre;
  /* Le même document que son étude, en plus court — il l'a déjà vu :
     on rejoue la ligne du bas, pas tout le devis. */
  const body = `
    ${ouverture(t.intro)}
    ${recapRows(args.snapshot)}
    ${
      net !== null && net > 0
        ? hero({ label: emails.etude.netLabel, value: `${fmtEuro(net)} / mois` })
        : ""
    }
    ${para(t.body, 22)}
    ${button(`${baseUrl()}/`, t.cta)}
    ${ctaNote(t.ctaSub)}`;
  return {
    subject,
    html: layout({
      preheader: t.intro,
      objetLine: objetLine(args.snapshot),
      body,
      unsubUrl: unsubUrl(args.unsubToken),
    }),
  };
}

export function relanceJ5Email(args: { snapshot: LooseSnapshot; unsubToken: string }): {
  subject: string;
  html: string;
} {
  const t = emails.relanceJ5;
  const net = num(args.snapshot?.net);
  const intro =
    net !== null && net > 0 ? t.introAvecChiffre(fmtEuro(net)) : t.introSansChiffre;
  /* Pas de tableau ici : une seule idée, le temps qui passe. */
  const body = `
    ${ouverture(intro)}
    ${para(t.body, 0)}
    <p style="margin:18px 0 0;font-family:'Courier New',Courier,monospace;font-size:14px;"><a href="${esc(`${baseUrl()}/cout-de-lattente.pdf`)}" style="color:${C.corailTexte};font-weight:bold;">${esc(t.pdfLabel)} →</a></p>
    ${button(`${baseUrl()}/`, t.cta)}
    ${ctaNote(t.ctaSub)}`;
  return {
    subject: t.subject,
    html: layout({
      preheader: intro,
      objetLine: objetLine(args.snapshot),
      body,
      unsubUrl: unsubUrl(args.unsubToken),
    }),
  };
}

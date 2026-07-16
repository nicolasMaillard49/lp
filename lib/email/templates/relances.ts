import { emails } from "@/config/emails";
import { C, baseUrl, button, ctaNote, esc, fmtEuro, layout, row } from "../layout";

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

/** Lignes de rappel des réglages — seulement ce qui existe dans le snapshot. */
function recapRows(s: LooseSnapshot): string {
  if (!s) return "";
  const metier = str(s.metier);
  const ville = str(s.ville);
  const budget = num(s.budget);
  const net = num(s.net);
  const rows = [
    metier ? row("Métier", esc(metier)) : "",
    ville ? row("Ville", esc(ville)) : "",
    budget !== null ? row("Budget mensuel", esc(fmtEuro(budget))) : "",
    net !== null ? row("Ce qui reste dans ta poche", esc(`${fmtEuro(net)}/mois`)) : "",
  ].join("");
  return rows
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 4px;">${rows}</table>`
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
  const body = `
    <p style="margin:0 0 22px;font-size:16px;line-height:1.65;">${esc(t.intro)}</p>
    ${recapRows(args.snapshot)}
    <p style="margin:22px 0 0;font-size:16px;line-height:1.7;">${esc(t.body)}</p>
    ${button(`${baseUrl()}/`, t.cta)}
    ${ctaNote(t.ctaSub)}`;
  return {
    subject,
    html: layout({ preheader: t.intro, body, unsubUrl: unsubUrl(args.unsubToken) }),
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
  const body = `
    <p style="margin:0 0 16px;font-size:19px;line-height:1.45;font-weight:bold;">${esc(intro)}</p>
    <p style="margin:0;font-size:16px;line-height:1.7;">${esc(t.body)}</p>
    <p style="margin:16px 0 0;font-size:15px;"><a href="${esc(`${baseUrl()}/cout-de-lattente.pdf`)}" style="color:${C.blue};font-weight:bold;">${esc(t.pdfLabel)} →</a></p>
    ${button(`${baseUrl()}/`, t.cta)}
    ${ctaNote(t.ctaSub)}`;
  return {
    subject: t.subject,
    html: layout({ preheader: intro, body, unsubUrl: unsubUrl(args.unsubToken) }),
  };
}

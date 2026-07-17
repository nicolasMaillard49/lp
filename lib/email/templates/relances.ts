import { emails } from "@/config/emails";
import {
  C,
  bandeau,
  baseUrl,
  big,
  button,
  ctaNote,
  esc,
  fmtEuro,
  layout,
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

/** Rappel des réglages — seulement ce que le snapshot contient. */
function recapRows(s: LooseSnapshot): string {
  if (!s) return "";
  const rows = [
    str(s.metier) ? row("Métier", esc(str(s.metier)!)) : "",
    str(s.ville) ? row("Ville", esc(str(s.ville)!)) : "",
    num(s.budget) !== null ? row("Budget mensuel", esc(fmtEuro(num(s.budget)!))) : "",
    num(s.ca) !== null ? row("CA estimé / mois", esc(fmtEuro(num(s.ca)!))) : "",
  ].join("");
  return rows
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;">${rows}</table>`
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
  /* `ca` et non `net` (2026-07-17) : le net présupposait sa marge. `ca`
     est dans la whitelist SNAP_NUM de /api/etude, donc présent partout.
     ⚠️ Les lignes créées AVANT cette date ont un snapshot avec `net` mais
     aussi `ca` — la bascule est rétro-compatible. */
  const ca = num(args.snapshot?.ca);
  const avecChiffre = ca !== null && ca > 0;
  const subject = avecChiffre ? t.subjectAvecChiffre(fmtEuro(ca)) : t.subjectSansChiffre;

  const body = `
    ${para(t.body, 0)}
    ${recapRows(args.snapshot)}
    ${button(`${baseUrl()}/`, t.cta)}
    ${ctaNote(t.ctaSub)}`;

  return {
    subject,
    html: layout({
      preheader: t.bandeauSub,
      bande: bandeau(
        avecChiffre
          ? `${esc(t.bandeauAvant)}<br>${big(fmtEuro(ca))} ${esc(t.bandeauApres)}`
          : esc(t.bandeauSansChiffre),
        t.bandeauSub
      ),
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
  /* Voir relanceJ2Email : `ca` remplace `net` depuis le 2026-07-17. */
  const ca = num(args.snapshot?.ca);
  const avecChiffre = ca !== null && ca > 0;

  /* Une seule idée : le temps qui passe. Pas de tableau. */
  const body = `
    ${para(t.body, 0)}
    <p style="margin:18px 0 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;"><a href="${esc(`${baseUrl()}/cout-de-lattente.pdf`)}" style="color:${C.corailTexte};font-weight:bold;text-decoration:none;">${esc(t.pdfLabel)} →</a></p>
    ${button(`${baseUrl()}/`, t.cta)}
    ${ctaNote(t.ctaSub)}`;

  return {
    subject: t.subject,
    html: layout({
      preheader: avecChiffre ? t.introAvecChiffre(fmtEuro(ca)) : t.introSansChiffre,
      bande: bandeau(
        avecChiffre
          ? `${esc(t.bandeauAvant)}<br>${big(fmtEuro(ca))} ${esc(t.bandeauApres)}`
          : esc(t.bandeauSansChiffre),
        t.bandeauSub
      ),
      body,
      unsubUrl: unsubUrl(args.unsubToken),
    }),
  };
}

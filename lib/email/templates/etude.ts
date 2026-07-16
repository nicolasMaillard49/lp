import { emails } from "@/config/emails";
import { C, baseUrl, button, ctaNote, esc, fmtEuro, hero, layout, row } from "../layout";

/* #1 — Étude ROI : le snapshot du simulateur mis en page façon
   document, envoyé immédiatement après la capture (/api/etude).
   Fonction pure — aucun accès réseau/base. */

/** Réglages du simulateur figés au moment de la capture.
    Le type vit ici (côté serveur) ; le composant client EmailEtude
    l'importe — jamais l'inverse. */
export type EtudeSnapshot = {
  metier: string;
  ville: string;
  budget: number;
  net: number;
  roi: number;
  ca: number;
  chantiers: number;
};

/** Le snapshot vient du jsonb (sanitizeSnapshot) : garde-fou avant d'envoyer. */
export function isEtudeSnapshot(
  v: Record<string, string | number> | null | undefined
): v is EtudeSnapshot & Record<string, string | number> {
  return (
    !!v &&
    typeof v.metier === "string" &&
    typeof v.ville === "string" &&
    typeof v.budget === "number" &&
    typeof v.net === "number" &&
    typeof v.roi === "number" &&
    typeof v.ca === "number" &&
    typeof v.chantiers === "number"
  );
}

export function etudeEmail(args: {
  snapshot: EtudeSnapshot;
  unsubToken: string;
}): { subject: string; html: string } {
  const s = args.snapshot;
  const t = emails.etude;
  const subject = t.subject(s.metier, s.ville);
  const unsubUrl = `${baseUrl()}/api/unsub?t=${encodeURIComponent(args.unsubToken)}`;

  const rows = [
    row("Métier", esc(s.metier)),
    row("Ville", esc(s.ville)),
    row("Budget mensuel (Ads + gestion)", esc(fmtEuro(s.budget))),
    row("Chantiers estimés / mois", esc(String(s.chantiers))),
    row("CA estimé / mois", esc(fmtEuro(s.ca))),
  ].join("");

  const roiTxt = s.roi.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  const body = `
    <p style="margin:0 0 22px;font-size:16px;line-height:1.65;">${esc(t.intro)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    ${hero({
      label: t.netLabel,
      value: `${fmtEuro(s.net)}/mois`,
      aside: `Retour ×${roiTxt} sur ce que tu investis.`,
    })}
    <p style="margin:18px 0 0;font-size:12px;line-height:1.65;color:${C.muted};">${esc(t.note)}</p>
    ${button(`${baseUrl()}/`, t.cta)}
    ${ctaNote(t.ctaSub)}`;

  return { subject, html: layout({ preheader: t.intro, body, unsubUrl }) };
}

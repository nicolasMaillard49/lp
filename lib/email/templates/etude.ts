import { emails } from "@/config/emails";
import {
  bandeau,
  baseUrl,
  big,
  button,
  ctaNote,
  esc,
  fmtEuro,
  layout,
  mention,
  para,
  row,
} from "../layout";

/* #1 — Étude ROI : envoyée immédiatement après la capture
   (/api/etude). Le chiffre est dans le bandeau, la démonstration
   en dessous. Fonction pure — aucun accès réseau/base. */

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

  /* Le chiffre est déjà dans le bandeau : ici on montre d'où il sort.
     Métier et ville sont dans le sous-titre du bandeau — les répéter
     volerait des lignes aux chiffres.
     La ligne « Retour sur ce que tu investis ×N » a sauté le 2026-07-17 :
     ce ×N était marge/investi, avec une marge que nous présupposions. */
  const rows = [
    row("Budget mensuel (Ads + gestion)", esc(fmtEuro(s.budget))),
    row("Chantiers estimés / mois", esc(String(s.chantiers))),
    row("CA estimé / mois", esc(fmtEuro(s.ca))),
  ].join("");

  const body = `
    ${para(t.intro, 0)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;">${rows}</table>
    ${mention(t.note)}
    ${button(`${baseUrl()}/`, t.cta)}
    ${ctaNote(t.ctaSub)}`;

  return {
    subject,
    html: layout({
      preheader: `${fmtEuro(s.ca)} de chantiers par mois — ton étude ${s.metier} à ${s.ville}.`,
      bande: bandeau(
        `${esc(t.bandeauAvant)}<br>${big(fmtEuro(s.ca))} ${esc(t.bandeauApres)}`,
        t.bandeauSub(s.metier, s.ville)
      ),
      body,
      unsubUrl,
    }),
  };
}

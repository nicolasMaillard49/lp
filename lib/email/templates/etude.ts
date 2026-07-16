import type { EtudeSnapshot } from "@/components/simulateur/EmailEtude";
import { emails } from "@/config/emails";
import { C, baseUrl, button, esc, fmtEuro, layout, row } from "../layout";

/* #1 — Étude ROI : le snapshot du simulateur mis en page façon
   document, envoyé immédiatement après la capture (/api/etude).
   Fonction pure — aucun accès réseau/base. */

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
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${esc(t.intro)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    <p style="margin:20px 0 0;padding:16px;background:${C.panel};border:1px solid ${C.line};font-size:14px;">${esc(t.netLabel)} : <strong style="color:${C.blue};font-size:18px;">${esc(fmtEuro(s.net))}/mois</strong> — retour ×${esc(roiTxt)}</p>
    <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:${C.muted};">${esc(t.note)}</p>
    ${button(`${baseUrl()}/`, t.cta)}
    <p style="margin:8px 0 0;text-align:center;font-size:11px;color:${C.muted};">${esc(t.ctaSub)}</p>`;

  return { subject, html: layout({ preheader: t.intro, body, unsubUrl }) };
}

import { emails } from "@/config/emails";
import { C, baseUrl, button, esc, layout } from "../layout";

/* #2 — Confirmation au prospect après le submit du formulaire.
   Part AVANT la réservation (« réserve ton créneau ») — Koalendar
   confirme APRÈS : pas de doublon. Email de service : pas de lien
   de désinscription. */

export function confirmationEmail(args: { prenom: string | null }): {
  subject: string;
  html: string;
} {
  const t = emails.confirmation;
  const intro = t.intro(args.prenom);
  const body = `
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6;font-weight:bold;">${esc(intro)}</p>
    <p style="margin:0;font-size:14px;line-height:1.7;">${esc(t.body)}</p>
    ${button(`${baseUrl()}/bienvenue?reserver=1`, t.cta)}
    <p style="margin:8px 0 0;text-align:center;font-size:11px;color:${C.muted};">${esc(t.ctaSub)}</p>`;
  return { subject: t.subject, html: layout({ preheader: intro, body }) };
}

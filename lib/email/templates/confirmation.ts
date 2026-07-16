import { emails } from "@/config/emails";
import { baseUrl, button, ctaNote, esc, layout } from "../layout";

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
    <p style="margin:0 0 14px;font-size:19px;line-height:1.45;font-weight:bold;">${esc(intro)}</p>
    <p style="margin:0;font-size:16px;line-height:1.7;">${esc(t.body)}</p>
    ${button(`${baseUrl()}/bienvenue?reserver=1`, t.cta)}
    ${ctaNote(t.ctaSub)}`;
  return { subject: t.subject, html: layout({ preheader: intro, body }) };
}

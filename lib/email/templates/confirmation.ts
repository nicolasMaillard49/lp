import { emails } from "@/config/emails";
import { baseUrl, button, ctaNote, layout, ouverture, para } from "../layout";

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
  /* Pas de chiffres ici : c'est un mot, pas un document. Ouverture en
     display, une phrase, le créneau. */
  const body = `
    ${ouverture(intro)}
    ${para(t.body, 0)}
    ${button(`${baseUrl()}/bienvenue?reserver=1`, t.cta)}
    ${ctaNote(t.ctaSub)}`;
  return {
    subject: t.subject,
    html: layout({ preheader: intro, objetLine: "Audit gratuit — 20 min", body }),
  };
}

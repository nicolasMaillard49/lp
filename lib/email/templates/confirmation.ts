import { emails } from "@/config/emails";
import { bandeau, baseUrl, button, ctaNote, layout, para } from "../layout";

/* #2 — Confirmation au prospect après le submit du formulaire.
   Part AVANT la réservation (« réserve ton créneau ») — Koalendar
   confirme APRÈS : pas de doublon. Email de service : pas de lien
   de désinscription. Pas de chiffres non plus — une seule idée. */

export function confirmationEmail(args: { prenom: string | null }): {
  subject: string;
  html: string;
} {
  const t = emails.confirmation;
  const body = `
    ${para(t.body, 0)}
    ${button(`${baseUrl()}/bienvenue?reserver=1`, t.cta)}
    ${ctaNote(t.ctaSub)}`;
  return {
    subject: t.subject,
    html: layout({
      preheader: t.bandeauSub,
      bande: bandeau(t.bandeau(args.prenom), t.bandeauSub),
      body,
    }),
  };
}

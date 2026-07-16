import { confirmationEmail } from "@/lib/email/templates/confirmation";
import { etudeEmail } from "@/lib/email/templates/etude";
import { notifInterneEmail } from "@/lib/email/templates/notif-interne";
import { relanceJ2Email, relanceJ5Email } from "@/lib/email/templates/relances";

/* Données d'exemple du parcours — partagées par la préview
   (/dev/emails) et l'envoi de test (/dev/emails/send), pour que ce
   qu'on regarde soit exactement ce qu'on reçoit. */

const SNAPSHOT = {
  metier: "Plombier",
  ville: "Bordeaux",
  budget: 1500,
  net: 892,
  roi: 1.6,
  ca: 4460,
  chantiers: 6,
};

const LEAD = {
  nom_prenom: "Karim Benali",
  email: "karim@exemple.fr",
  telephone: "06 12 34 56 78",
  ville: "Bordeaux",
  activite: "Plombier",
  ca_actuel: "8 000 – 15 000 €",
  ca_objectif: "20 000 € et plus",
  problematique: "Pas assez de demandes régulières, dépendant du bouche-à-oreille.",
  reglable_seul: false,
  experience_digital: 2,
  budget_ads: 1000,
  sim_ca_estime: 4460,
  utm_source: "facebook",
  utm_campaign: "lp-acquisition",
  device: "mobile",
};

const TOKEN = "00000000-0000-4000-8000-000000000000";

export type SampleEmail = {
  title: string;
  /** Vrai destinataire en prod : le prospect, ou la boîte interne. */
  audience: "prospect" | "interne";
  subject: string;
  html: string;
};

export function sampleEmails(): SampleEmail[] {
  return [
    {
      title: "1 · Étude ROI — immédiat, à la capture",
      audience: "prospect",
      ...etudeEmail({ snapshot: SNAPSHOT, unsubToken: TOKEN }),
    },
    {
      title: "2 · Confirmation — au submit du form",
      audience: "prospect",
      ...confirmationEmail({ prenom: "Karim" }),
    },
    {
      title: "3 · Notification interne — au submit du form",
      audience: "interne",
      ...notifInterneEmail({ lead: LEAD }),
    },
    {
      title: "4 · Relance J+2 — email laissé, pas de RDV",
      audience: "prospect",
      ...relanceJ2Email({ snapshot: SNAPSHOT, unsubToken: TOKEN }),
    },
    {
      title: "5 · Relance J+5 — le coût de l'attente",
      audience: "prospect",
      ...relanceJ5Email({ snapshot: SNAPSHOT, unsubToken: TOKEN }),
    },
  ];
}

import { notFound } from "next/navigation";
import { confirmationEmail } from "@/lib/email/templates/confirmation";
import { etudeEmail } from "@/lib/email/templates/etude";
import { notifInterneEmail } from "@/lib/email/templates/notif-interne";
import { relanceJ2Email, relanceJ5Email } from "@/lib/email/templates/relances";

/* Préview des 5 emails du parcours — DEV UNIQUEMENT (notFound() en
   prod). Les templates sont des fonctions pures : on les rend ici
   avec des données d'exemple, sans clé, sans envoi. */

export const dynamic = "force-dynamic";

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

export default function DevEmailsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const items = [
    { title: "1 · Étude ROI — immédiat, à la capture", ...etudeEmail({ snapshot: SNAPSHOT, unsubToken: TOKEN }) },
    { title: "2 · Confirmation — au submit du form", ...confirmationEmail({ prenom: "Karim" }) },
    { title: "3 · Notification interne — au submit du form", ...notifInterneEmail({ lead: LEAD }) },
    { title: "4 · Relance J+2 — email laissé, pas de RDV", ...relanceJ2Email({ snapshot: SNAPSHOT, unsubToken: TOKEN }) },
    { title: "5 · Relance J+5 — le coût de l'attente", ...relanceJ5Email({ snapshot: SNAPSHOT, unsubToken: TOKEN }) },
  ];

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 16px", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Parcours email — préview dev</h1>
      <p style={{ color: "#666", marginBottom: 32 }}>
        Rendu exact des 5 emails (données d&apos;exemple). Rien n&apos;est envoyé.
      </p>
      {items.map((item) => (
        <section key={item.title} style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, marginBottom: 4 }}>{item.title}</h2>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
            Objet : <strong>{item.subject}</strong>
          </p>
          <iframe
            srcDoc={item.html}
            title={item.title}
            style={{ width: "100%", height: 680, border: "1px solid #ddd", background: "#fff" }}
          />
        </section>
      ))}
    </main>
  );
}

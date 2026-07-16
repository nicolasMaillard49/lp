import { emails } from "@/config/emails";
import { bandeau, baseUrl, button, esc, ficheRow, layout, para } from "../layout";

/* #3 — Notification interne vers NOTIF_EMAIL au submit du form :
   les réponses du lead, en clair, pour arrêter de surveiller
   Supabase à la main. Destinataire interne → pas d'unsub. */

const FIELDS: ReadonlyArray<readonly [key: string, label: string]> = [
  ["nom_prenom", "Nom"],
  ["email", "Email"],
  ["telephone", "Téléphone"],
  ["ville", "Ville"],
  ["activite", "Activité"],
  ["ca_actuel", "CA actuel"],
  ["ca_objectif", "Objectif CA"],
  ["problematique", "Problématique"],
  ["reglable_seul", "Réglable seul"],
  ["experience_digital", "Expérience digital (/5)"],
  ["ouvert_accompagnement", "Ouvert à un accompagnement"],
  ["investir_financierement", "Prêt à investir"],
  ["instagram", "Instagram"],
  ["budget_ads", "Budget Ads (simulateur)"],
  ["sim_ca_estime", "CA estimé (simulateur)"],
  ["utm_source", "utm_source"],
  ["utm_medium", "utm_medium"],
  ["utm_campaign", "utm_campaign"],
  ["utm_content", "utm_content"],
  ["device", "Device"],
];

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

export function notifInterneEmail(args: { lead: Record<string, unknown> }): {
  subject: string;
  html: string;
} {
  const { lead } = args;
  const t = emails.notif;
  const subject = t.subject(
    str(lead.nom_prenom) ?? "—",
    str(lead.activite) ?? "?",
    str(lead.ville) ?? "?"
  );

  const rows = FIELDS.map(([key, label]) => {
    const v = lead[key];
    if (v === null || v === undefined || v === "") return "";
    const text = typeof v === "boolean" ? (v ? "oui" : "non") : String(v);
    return ficheRow(label, esc(text));
  }).join("");

  /* Destinataire : Nicolas. Une fiche à lire en diagonale, pas une
     vente — mais même bandeau : le nom du lead saute aux yeux. */
  const body = `
    ${para(t.intro, 0)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;">${rows}</table>
    ${button(`${baseUrl()}/admin`, t.cta)}`;

  return {
    subject,
    html: layout({
      preheader: subject,
      bande: bandeau(
        esc(t.bandeau(str(lead.nom_prenom) ?? "—")),
        t.bandeauSub(str(lead.activite) ?? "?", str(lead.ville) ?? "?")
      ),
      body,
      interne: true,
    }),
  };
}

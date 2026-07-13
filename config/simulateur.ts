/* ──────────────────────────────────────────────────────────────
   Simulateur ROI — contenu + presets par métier.
   CPC : moyennes France 2024-2025 (skill google-ads-artisans).
   LSA : coût par appel constaté 20-50 € selon le métier.
   ────────────────────────────────────────────────────────────── */

export type Metier = {
  nom: string;
  /** CPC national moyen (€) — multiplié par la zone. */
  cpc: number;
  /** Coût par appel LSA (€). */
  cpa: number;
  /** Panier moyen d'un chantier (€) — preset, ajustable. */
  panier: number;
  /** Transformation lead → chantier (%) — preset, ajustable. */
  transfo: number;
};

export const simulateur = {
  meta: {
    title: "Simulateur ROI — NMF Agence",
    description:
      "Ton métier, ta ville, ton budget : estime en direct combien de chantiers et de chiffre d'affaires la publicité Google peut te rapporter chaque mois.",
  },

  back: "Retour à la présentation",
  backHref: "/preparation#ressources",

  eyebrow: "L'outil NMF",
  title: "Simule ton retour sur investissement",
  subtitle:
    "Choisis ton métier et ta zone, règle ton budget : le simulateur estime en direct tes leads, tes chantiers et ton retour chaque mois. Les curseurs sont pré-remplis avec les moyennes de ton métier — remplace-les par tes vrais chiffres.",

  params: {
    heading: "Paramètres",
    metier: "Métier",
    zone: "Zone",
    ads: "Budget Google Ads / mois",
    adsHint: "Minimum conseillé : 10 €/jour (300 €/mois)",
    lsa: "Budget Local Services Ads / mois",
    lsaHint: "Payé au lead (appel ou message reçu)",
    gestion: "Gestion NMF / mois",
    gestionHint: "Forfait fixe — pilotage, optimisation et suivi des appels",
    conv: "Conversion du site (Ads)",
    convHint: "Visiteurs → appel ou formulaire",
    transfo: "Transformation lead → chantier",
    panier: "Panier moyen chantier",
  },

  kpis: {
    leads: "Leads / mois",
    chantiers: "Chantiers / mois",
    ca: "CA généré",
    roi: "Retour sur investissement",
  },

  detail: {
    heading: "Détail par canal",
    ads: "Google Ads",
    cpc: "CPC ajusté zone",
    clics: "Clics",
    leads: "Leads",
    cpl: "Coût / lead",
    lsa: "Local Services Ads",
    cpa: "Coût / appel",
    leadsLsa: "Leads (payés au contact)",
    facture: "Investissement / mois",
    media: "Média Google (Ads + LSA)",
    gestion: "Gestion NMF",
    total: "Total investi",
    cac: "Coût d'acquisition par chantier",
  },

  verdicts: {
    high: (total: string, ca: string, roi: string) =>
      `Très rentable — ${total} investis, ${ca} de chiffre d'affaires estimé (×${roi}). Et chaque client satisfait en amène d'autres.`,
    mid: (roi: string) =>
      `Rentable — retour ×${roi}. Pour ton métier, la récurrence client (réachat, urgences répétées) s'ajoute encore au calcul.`,
    low: (roi: string) =>
      `Marge fine — retour ×${roi} avec ces réglages : le volume et la récurrence font la différence. Augmente la part LSA (leads moins chers) ou ton panier moyen.`,
  },

  comparatif: {
    heading: "Comparatif tous métiers",
    hint: "mêmes budgets, moyennes par métier",
    cols: ["Métier", "CPC", "Leads", "Chantiers", "Panier", "CA", "Retour"],
  },

  footnote:
    "Hypothèses conservatrices — CPC moyens France, LSA 20-50 € par appel. Les vrais chiffres se mesurent après 2 mois de campagne, avec un suivi des appels indépendant.",

  /** Forfait gestion NMF (€/mois) — valeur fixe, non réglable par le visiteur. */
  gestionFixe: 500,

  zones: [
    { label: "Paris (×1,8)", mult: 1.8 },
    { label: "Bordeaux / Lyon / Marseille (×1,3)", mult: 1.3 },
    { label: "Toulouse / Nantes / Nice (×1,2)", mult: 1.2 },
    { label: "Ville 50-200k hab. (×1,0)", mult: 1.0 },
    { label: "Rural (×0,7)", mult: 0.7 },
  ],
  defaultZone: 1,

  metiers: [
    { nom: "Plombier", cpc: 4.2, cpa: 30, panier: 500, transfo: 45 },
    { nom: "Serrurier", cpc: 6.0, cpa: 35, panier: 300, transfo: 45 },
    { nom: "Chauffagiste", cpc: 5.0, cpa: 35, panier: 1500, transfo: 35 },
    { nom: "Électricien", cpc: 3.5, cpa: 25, panier: 800, transfo: 40 },
    { nom: "Maçon", cpc: 2.8, cpa: 25, panier: 3500, transfo: 30 },
    { nom: "Peintre", cpc: 2.5, cpa: 20, panier: 2000, transfo: 30 },
    { nom: "Menuisier", cpc: 2.2, cpa: 20, panier: 1800, transfo: 35 },
    { nom: "Carreleur", cpc: 2.0, cpa: 20, panier: 2500, transfo: 30 },
    { nom: "Paysagiste", cpc: 1.8, cpa: 20, panier: 1200, transfo: 35 },
    { nom: "Déménageur", cpc: 3.0, cpa: 25, panier: 900, transfo: 35 },
  ] satisfies Metier[],
} as const;

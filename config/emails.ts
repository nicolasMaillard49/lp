/* ──────────────────────────────────────────────────────────────
   Textes du parcours email — 5 emails (voir la spec
   docs/superpowers/specs/2026-07-16-parcours-email-design.md).

   Même logique que site.ts / simulateur.ts : tout le wording est
   ici, modifiable sans toucher aux templates. Tutoiement, ton
   sobre « document » — pas de pression artificielle.
   ────────────────────────────────────────────────────────────── */

export const emails = {
  footer: {
    signature: "Nicolas Maillard — NMF Agence",
    mentions:
      "Tu reçois cet email parce que tu as laissé ton adresse sur bienvenue.nmf-agence.com.",
    unsubLabel: "Ne plus recevoir d'emails",
  },

  /** #1 — Étude ROI, envoyée immédiatement après la capture. */
  etude: {
    subject: (metier: string, ville: string) => `Ton étude Google Ads — ${metier} à ${ville}`,
    intro: "Comme promis, voici ton étude — tes réglages, tes chiffres.",
    netLabel: "Ce qui reste dans ta poche",
    note: "Une projection, pas une promesse : ni un plancher, ni un plafond. On l'affine avec tes vrais chiffres pendant l'audit.",
    cta: "Recevoir mon audit gratuit",
    ctaSub: "10 questions · 2 minutes · Sans engagement",
  },

  /** #2 — Confirmation au prospect, au submit du formulaire. */
  confirmation: {
    subject: "C'est noté — ton audit est en préparation",
    intro: (prenom: string | null) =>
      prenom ? `${prenom}, tes réponses sont bien arrivées.` : "Tes réponses sont bien arrivées.",
    body: "J'analyse ton activité et ta zone avant notre échange. Il ne reste qu'une chose à faire : réserver ton créneau, si ce n'est pas déjà fait.",
    cta: "Réserver mon créneau",
    ctaSub: "20 minutes · Gratuit · Sans engagement",
  },

  /** #3 — Notification interne (NOTIF_EMAIL), au submit du formulaire. */
  notif: {
    subject: (nom: string, activite: string, ville: string) =>
      `Nouveau lead — ${nom} (${activite} · ${ville})`,
    intro: "Nouveau formulaire complété sur la LP.",
    cta: "Ouvrir le dashboard",
  },

  /** #4 — Relance J+2 : son chiffre l'attend. */
  relanceJ2: {
    subjectAvecChiffre: (net: string) => `${net} par mois — ton étude t'attend`,
    subjectSansChiffre: "Ton étude Google Ads t'attend",
    intro: "Il y a deux jours, tu as fait ton étude sur le simulateur. Elle en était là :",
    body: "Ces chiffres ne bougeront pas tout seuls. La prochaine étape tient en 10 questions.",
    cta: "Recevoir mon audit gratuit",
    ctaSub: "10 questions · 2 minutes · Sans engagement",
  },

  /** #5 — Relance J+5 : le coût de l'attente (matière du PDF R2). */
  relanceJ5: {
    subject: "Le coût de l'attente",
    introAvecChiffre: (net: string) =>
      `Chaque mois qui passe sans campagne, c'est environ ${net} de marge qui ne rentre pas.`,
    introSansChiffre: "Chaque mois qui passe sans campagne, c'est de la marge qui ne rentre pas.",
    body: "Ce n'est pas une urgence artificielle : c'est le même calcul que ton étude, projeté dans le temps. Le raisonnement complet tient en 2 pages :",
    pdfLabel: "Le coût de l'attente (PDF, 2 pages)",
    cta: "Recevoir mon audit gratuit",
    ctaSub: "10 questions · 2 minutes · Sans engagement",
  },
} as const;

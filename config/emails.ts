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
    /** Adresse de contact : c'est ici qu'on répond à Nicolas. */
    contact: "contact@nmf-agence.com",
    repondre: "réponds directement à cet email, c'est moi qui lis.",
    mentions:
      "Tu reçois cet email parce que tu as laissé ton adresse sur bienvenue.nmf-agence.com.",
    /** Les emails internes ne se justifient pas auprès de leur destinataire. */
    mentionsInterne: "Notification interne — envoyée à chaque formulaire complété.",
    unsubLabel: "Ne plus recevoir d'emails",
  },

  /** #1 — Étude ROI, envoyée immédiatement après la capture. */
  etude: {
    subject: (metier: string, ville: string) => `Ton étude Google Ads — ${metier} à ${ville}`,
    /** Bandeau : le chiffre vit dans la phrase, `{net}` y est agrandi. */
    bandeauAvant: "Chaque mois, il te resterait",
    bandeauApres: "dans la poche.",
    bandeauSub: (metier: string, ville: string) =>
      `${metier} à ${ville} — voici d'où sort ce chiffre.`,
    intro: "Comme promis, voici ton étude — tes réglages, tes chiffres.",
    note: "Une projection, pas une promesse : ni un plancher, ni un plafond. On l'affine avec tes vrais chiffres pendant l'audit.",
    cta: "Recevoir mon audit gratuit",
    ctaSub: "10 questions · 2 minutes · Sans engagement",
  },

  /** #2 — Confirmation au prospect, au submit du formulaire. */
  confirmation: {
    subject: "C'est noté — ton audit est en préparation",
    bandeau: (prenom: string | null) =>
      prenom ? `${prenom}, c'est noté.` : "C'est noté.",
    bandeauSub: "Tes réponses sont arrivées. Il reste une étape.",
    body: "J'analyse ton activité et ta zone avant notre échange. Il ne reste qu'une chose à faire : réserver ton créneau, si ce n'est pas déjà fait.",
    cta: "Réserver mon créneau",
    ctaSub: "20 minutes · Gratuit · Sans engagement",
  },

  /** #3 — Notification interne (NOTIF_EMAIL), au submit du formulaire. */
  notif: {
    subject: (nom: string, activite: string, ville: string) =>
      `Nouveau lead — ${nom} (${activite} · ${ville})`,
    bandeau: (nom: string) => `Nouveau lead : ${nom}`,
    bandeauSub: (activite: string, ville: string) => `${activite} · ${ville} — formulaire complété.`,
    intro: "Ses réponses, dans l'ordre du formulaire.",
    cta: "Ouvrir le dashboard",
  },

  /** #4 — Relance J+2 : son chiffre l'attend. */
  relanceJ2: {
    subjectAvecChiffre: (net: string) => `${net} par mois — ton étude t'attend`,
    subjectSansChiffre: "Ton étude Google Ads t'attend",
    bandeauAvant: "Ton étude t'attend toujours :",
    bandeauApres: "par mois.",
    bandeauSansChiffre: "Ton étude Google Ads t'attend toujours.",
    bandeauSub: "Tu l'as faite il y a deux jours. Les chiffres n'ont pas bougé.",
    body: "Ces chiffres ne bougeront pas tout seuls. La prochaine étape tient en 10 questions — deux minutes, et je te dis ce que ça donne vraiment pour ta zone.",
    cta: "Recevoir mon audit gratuit",
    ctaSub: "10 questions · 2 minutes · Sans engagement",
  },

  /** #5 — Relance J+5 : le coût de l'attente (matière du PDF R2). */
  relanceJ5: {
    subject: "Le coût de l'attente",
    bandeauAvant: "Chaque mois sans campagne, ce sont",
    bandeauApres: "qui ne rentrent pas.",
    bandeauSansChiffre: "Chaque mois sans campagne, c'est de la marge qui ne rentre pas.",
    bandeauSub: "Ce n'est pas une urgence inventée : c'est ton propre calcul, dans le temps.",
    introAvecChiffre: (net: string) =>
      `Chaque mois qui passe sans campagne, c'est environ ${net} de marge qui ne rentre pas.`,
    introSansChiffre: "Chaque mois qui passe sans campagne, c'est de la marge qui ne rentre pas.",
    body: "Ce n'est pas une urgence artificielle : c'est le même calcul que ton étude, projeté dans le temps. Le raisonnement complet tient en 2 pages :",
    pdfLabel: "Le coût de l'attente (PDF, 2 pages)",
    cta: "Recevoir mon audit gratuit",
    ctaSub: "10 questions · 2 minutes · Sans engagement",
  },
} as const;

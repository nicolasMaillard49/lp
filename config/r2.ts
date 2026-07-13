// ──────────────────────────────────────────────────────────────
//  Édite CE fichier pour personnaliser la LP de R2 (/preparation).
//  Contexte : le prospect a DÉJÀ fait son premier rendez-vous (R1 /
//  diagnostic). Cette page prépare le R2 (appel de décision) :
//  1. il regarde la présentation d'offre (vidéo),
//  2. il lit le détail de l'offre (durée, phases, méthode, outils, résultats),
//  3. il remplit le questionnaire R2,
//  4. il arrive au rendez-vous avec UNE seule question : « je me lance ? ».
// ──────────────────────────────────────────────────────────────

export const r2 = {
  /** Nombre d'étapes du parcours de préparation. */
  totalSteps: 3,

  hero: {
    badge: "Après ton diagnostic",
    title: "Ton diagnostic est posé. Voici exactement ce que je te propose.",
    subtitle:
      "Tout est ici, noir sur blanc. Regarde. Lis. Réponds. Et viens au rendez-vous avec une seule question : est-ce que je me lance ?",
    ctaPrimary: "Voir la présentation",
    /** Tracker de parcours affiché à côté du titre. */
    journey: [
      { label: "Diagnostic", note: "Fait ensemble, au premier rendez-vous", done: true },
      { label: "La proposition", note: "Cette page — tout y est détaillé", done: false, current: true },
      { label: "La décision", note: "Notre prochain rendez-vous", done: false },
    ],
  },

  video: {
    /** Dépose ta vidéo de présentation d'offre dans /public. */
    src: "/offre.mp4",
    /** Poster optionnel dans /public — un dégradé s'affiche sinon.
        Mets par ex. "/poster-offre.jpg" quand le fichier existe
        (undefined = pas de requête ni de preload inutile). */
    poster: undefined as string | undefined,
    notice: {
      title: "À regarder avant notre prochain rendez-vous",
      text: "Regarde-la maintenant : le rendez-vous sera 100 % consacré à TES questions.",
    },
  },

  /** L'offre noir sur blanc — les 6 éléments indispensables. */
  offre: {
    eyebrow: "L'offre, noir sur blanc",
    title: "Ce que contient l'accompagnement",
    subtitle: "Trois étapes. Scrolle — on te déroule le plan.",
    /** ⚠️ À valider : durée réelle de ton accompagnement. */
    duree: {
      label: "Durée",
      value: "3 mois",
      note: "puis on continue uniquement si les chiffres le justifient",
    },
    phases: [
      {
        periode: "Semaine 1",
        title: "On pose les fondations",
        text: "Campagnes Google sur mesure, page dédiée, suivi des appels. Toi ? Rien de technique à faire.",
        resultat: "Tout est en place, prêt à diffuser.",
      },
      {
        periode: "Semaines 2 à 4",
        title: "On teste en conditions réelles",
        text: "Les campagnes tournent sur ta zone. On garde ce qui fait sonner ton téléphone — pas ce qui fait des clics.",
        resultat: "Tes premières demandes entrantes.",
      },
      {
        periode: "Mois 2 et 3",
        title: "On monte en puissance",
        text: "On coupe ce qui ne rapporte pas. On pousse ce qui marche. Chaque euro est justifié.",
        resultat: "Un flux régulier de chantiers.",
      },
    ],
    methode: {
      title: "Ma méthode",
      text: "Je ne vends pas des clics, je remplis des agendas. Et si je pense ne pas pouvoir t'apporter de résultats, je te le dis avant que tu dépenses un euro.",
    },
    outils: {
      title: "Les outils",
      items: [
        "Campagnes Google Ads gérées de A à Z",
        "Page de destination dédiée à ton activité",
        "Suivi des appels et des demandes de devis",
        "Point régulier ensemble, chiffres à l'appui",
      ],
    },
    resultats: {
      title: "Ce que tu peux en attendre",
      items: [
        "Des demandes de devis dès les premières semaines",
        "Un coût par demande connu — tu sais ce que chaque chantier t'a coûté",
        "Un agenda qui se remplit sans prospection",
      ],
      disclaimer:
        "Les résultats varient selon le métier, la zone et le budget — on en parle honnêtement au rendez-vous.",
    },
  },

  /**
   * Étape 2 — le questionnaire, en FIN de page : après l'offre et les preuves.
   * Formulaire custom (comme le R1) : questions dans config/form-r2.ts,
   * réponses stockées dans Supabase (table r2_responses) et visibles
   * dans le dash admin, onglet « Questionnaire R2 ».
   */
  questionnaire: {
    title: "Dernière chose : réponds au questionnaire",
    subtitle:
      "7 questions, 2 minutes. Tes réponses me servent à préparer un rendez-vous sur mesure — et à traiter d'avance ce qui te ferait hésiter.",
    href: "/preparation/questionnaire",
    button: "Remplir le questionnaire",
    meta: "2 minutes · 7 questions",
    points: [
      "Ton retour sur notre premier échange",
      "Ce dont tu as besoin pour décider sereinement",
      "Les questions à préparer pour le rendez-vous",
    ],
  },

  /** Études de cas — identification avant la décision. */
  cases: {
    eyebrow: "Ils sont passés par là",
    title: "Des artisans qui étaient exactement à ta place",
    items: [
      {
        metier: "Plombier · Lyon",
        author: "Karim",
        stat: "3 semaines",
        statLabel: "pour remplir l'agenda sur deux mois",
        quote:
          "Trois semaines après le lancement, mon agenda était plein pour deux mois.",
      },
      {
        metier: "Électricien · Nantes",
        author: "Sébastien",
        stat: "0 soirée",
        statLabel: "passée à prospecter depuis le lancement",
        quote:
          "Je passais mes soirées à chercher des chantiers. Maintenant, ce sont les clients qui m'appellent.",
      },
      {
        metier: "Maçon · Bordeaux",
        author: "Thomas",
        stat: "3 rénovations",
        statLabel: "complètes signées en deux mois",
        quote:
          "En deux mois, j'ai signé trois rénovations complètes. Jamais eu ça avec les flyers.",
      },
    ],
  },

  /**
   * Apport de valeur / traitement des objections — une ressource par doute
   * fréquent (module « Comprendre et traiter les objections » du funnel).
   */
  ressources: {
    eyebrow: "Avant de décider",
    title: "Les réponses aux questions que tu te poses déjà",
    subtitle:
      "Un simulateur pour voir ton retour en direct, trois ressources pour lever tes derniers doutes. À consulter avant le rendez-vous.",
    button: "Télécharger",
    featured: {
      objection: "« Et pour mon métier, ça rapporte quoi ? »",
      tag: "Le simulateur",
      title: "Simule ton retour sur investissement",
      desc: "Ton métier, ta ville, ton budget : le simulateur calcule en direct tes leads, tes chantiers et ton retour chaque mois. Pré-rempli avec les moyennes de ton métier.",
      button: "Ouvrir le simulateur",
      href: "/simulateur",
      meta: "Gratuit · Sans inscription · 2 minutes",
    },
    gifts: [
      {
        objection: "« Est-ce que ça marche vraiment ? »",
        tag: "L'étude de cas",
        title: "Un agenda plein en 3 semaines",
        desc: "Le parcours de Karim, plombier à Lyon : avant/après et déroulé semaine par semaine, chiffres à l'appui.",
        file: "/etude-de-cas-plombier.pdf",
        meta: "PDF · 2 pages",
      },
      {
        objection: "« Je verrai ça plus tard »",
        tag: "Le calcul",
        title: "Le coût de l'attente",
        desc: "Ce qu'un mois sans campagne te coûte réellement — calculé avec des chiffres conservateurs. Attendre n'est pas gratuit.",
        file: "/cout-de-lattente.pdf",
        meta: "PDF · 2 pages",
      },
      {
        objection: "« Comment être sûr de bien décider ? »",
        tag: "La checklist",
        title: "7 questions à te poser avant de dire oui",
        desc: "À remplir avant le rendez-vous : le tri entre vrais blocages et zones d'ombre — on traitera les tiennes en premier.",
        file: "/checklist-decision.pdf",
        meta: "PDF · 1 page",
      },
    ],
  },

  /**
   * FAQ — mêmes 4 angles que la LP R2 du coach (temps au quotidien, délai
   * des résultats, garantie, déroulé) mais adaptés aux artisans.
   */
  faq: {
    eyebrow: "FAQ",
    title: "Tu te poses probablement ces questions",
    items: [
      {
        q: "Combien de temps ça va me prendre au quotidien ?",
        a: "Quasiment rien. Je gère tout de A à Z — toi, tu réponds au téléphone et tu fais tes devis.",
      },
      {
        q: "En combien de temps arrivent les premières demandes ?",
        a: "Diffusion dès la première semaine, premières demandes en général dans les semaines qui suivent. Le rythme exact dépend du métier, de la zone et du budget.",
      },
      {
        q: "Et si ça ne marche pas pour mon métier ou ma zone ?",
        a: "Si je n'y crois pas, je te le dis avant que tu dépenses un euro. Et une fois lancé, tout est mesuré : on coupe ce qui ne rapporte pas.",
      },
      {
        q: "Comment se passe concrètement le démarrage ?",
        a: "Ta décision, puis tout est en place en une semaine. Ensuite on teste, et on optimise mois après mois.",
      },
    ],
  },

  /**
   * La promesse — bloc de garantie avant la décision (comme le « Ma promesse »
   * de la LP du coach). ⚠️ À valider : si tu veux une garantie forte type
   * « résultats ou remboursé », remplace le texte ci-dessous.
   */
  promesse: {
    eyebrow: "Ma promesse",
    title: "Je ne te laisse pas dans le flou.",
    text: "Si je pense ne pas pouvoir t'apporter de résultats, je te le dis avant que tu dépenses un euro. Une fois lancé, chaque euro est suivi — et on ne continue que si les chiffres le justifient.",
    signature: "Nicolas — NMF Agence",
  },

  /** Étape 3 — le cadre du rendez-vous de décision. */
  cadre: {
    title: "Arrive prêt à décider",
    conditions:
      "Le jour J : cadre calme, bonne connexion, à l'heure. Si quelqu'un d'autre participe à la décision, il est là aussi.",
    mindset:
      "Tu auras tout vu, tout lu. Ce rendez-vous sert à une seule chose : décider. Oui ou non — pas « je vais y réfléchir ».",
  },

  finalCta: {
    title: "À très vite pour ta décision.",
    subtitle:
      "Tout est entre tes mains. Une question d'ici là ? Note-la — on la traite en premier.",
    button: "Revoir la présentation",
    reassurance: "Un imprévu ? Tu peux reprogrammer depuis ton mail de confirmation.",
  },
} as const;

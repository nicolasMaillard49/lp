// ──────────────────────────────────────────────────────────────
//  Édite CE fichier pour personnaliser la landing page.
//  Contexte : le visiteur a DÉJÀ réservé son rendez-vous (R1 / audit).
//  Le rôle de la page = le rassurer, présenter l'activité et lui faire
//  regarder la vidéo pour qu'il arrive préparé (et ne pose pas de lapin).
// ──────────────────────────────────────────────────────────────

import { simulateur } from "./simulateur";

const METIERS = simulateur.metiers.map((m) => m.nom);

export const site = {
  /** Nom de l'entreprise (en-tête + footer). */
  name: "NMF Agence",
  /** Nom du fondateur, affiché en signature. */
  founder: "Nicolas Maillard",

  /**
   * Étape booking du funnel — événement iClosed « Audit de situation ».
   * iClosed collecte email/prénom/nom, pose SES questions de
   * qualification (réplique des 13 — vérifié le 2026-07-14), propose le
   * créneau, puis redirige vers /bienvenue (transmission des paramètres
   * activée : le fbclid survit au passage, testé le 2026-07-11).
   * ⚠️ iClosed ignore les paramètres de préremplissage (email, name…)
   * — testés le 2026-07-14, tous sans effet. On les envoie quand même :
   * inoffensif aujourd'hui, utile s'ils l'activent un jour.
   */
  booking: {
    url: "https://app.iclosed.io/e/NMF-Agence/vsl-funnel",
  },

  /** Lien secondaire : reprogrammer / mail de confirmation / contact. */
  ctaHref: "#contact",

  /** Nombre d'étapes du flow de confirmation. */
  totalSteps: 4,

  /**
   * LP d'acquisition `/` — page d'atterrissage des ads (2026-07-14).
   * À ne pas confondre avec `hero` ci-dessous, qui est le hero POST-booking
   * de `/bienvenue` (« sans ces 4 étapes ton RDV sera annulé ») : ce ton
   * n'a aucun sens pour un inconnu qui découvre l'agence.
   */
  lp: {
    eyebrow: "Artisans du bâtiment",
    title: "Combien de chantiers tu laisses à ton concurrent chaque mois ?",
    subtitle:
      "Règle les curseurs avec tes vrais chiffres — ton métier, ta ville, ton budget. Tu vois ce que la publicité Google peut te rapporter. Pas de promesse en l'air : ton calcul, sous tes yeux, en 2 minutes.",
    reassurance: "Gratuit · Sans inscription · Aucun engagement",
    cta: "On en parle 20 minutes ?",
  },

  hero: {
    badge: "Action requise",
    title: "Attention : sans ces 4 étapes, ton rendez-vous sera annulé.",
    subtitle:
      "Tu as réservé, mais RIEN n'est confirmé. Complète les 4 étapes ci-dessous dès maintenant. Si tu ne le fais pas, j'annule notre entretien — sans relance, sans exception.",
    ctaPrimary: "Commencer l'étape 1",
  },

  /**
   * Métiers — marquee + options du formulaire.
   * Dérivé de `simulateur.metiers` : le simulateur est la source de vérité
   * (lui seul porte les CPC / panier / transfo). Ne pas lister à la main
   * ici, sinon un métier proposé au form devient insimulable.
   */
  metiers: METIERS,

  /** Warning qui prépare le client → rendez-vous plus rentable. */
  notice: {
    title: "À faire avant notre rendez-vous",
    text: "Regarde la vidéo en entier. Les 20 minutes qu'on passera ensemble vaudront 10× plus si tu connais déjà la méthode.",
  },

  video: {
    /** Mets ton fichier dans /public et indique son chemin ici. */
    src: "/presentation.mp4",
    /** Image d'aperçu (poster) dans /public. Optionnel — un dégradé s'affiche sinon. */
    poster: "/poster.jpg",
    label: "45 secondes pour comprendre comment je remplis ton agenda",
  },

  /** Étape 2 — ajouter le rendez-vous à l'agenda. */
  agenda: {
    title: "Ajoute le rendez-vous à ton agenda",
    subtitle:
      "Tu vas recevoir une invitation par mail. Ajoute-la tout de suite pour ne pas oublier notre échange.",
    steps: [
      "Ouvre le mail d'invitation que je t'ai envoyé",
      "Clique sur « Je connais cet expéditeur »",
      "Puis sur « Oui » pour l'ajouter à ton agenda",
    ],
    note: "Pense à vérifier tes spams si tu ne le trouves pas.",
  },

  /** Étape 4 — se présenter dans les bonnes conditions. */
  presence: {
    title: "Présente-toi à l'heure au rendez-vous",
    conditions:
      "Le jour J : bonne connexion, cadre calme, à l'heure pile. Plus de 5 min de retard sans prévenir = rendez-vous non reporté.",
    mindset:
      "Cet appel est fait pour les entrepreneurs prêts à avancer — pas pour « voir ». On pose un diagnostic clair et tu repars avec des actions concrètes.",
  },

  // Une vraie séquence → les numéros portent du sens.
  method: {
    title: "Un accompagnement, pas un simple outil",
    lead: "Tu peux investir 10 000 € : sans un bon pilote, c'est 10 000 € perdus. Ce qui change tout, ce n'est pas le budget — c'est qui gère tes campagnes.",
    steps: [
      {
        title: "On audite",
        text: "On regarde ensemble ta situation et ton secteur, pour voir si je peux vraiment t'apporter de la valeur. Si ce n'est pas le cas, je te le dis franchement.",
      },
      {
        title: "On teste",
        text: "Pendant une semaine, sur une durée définie, on teste pour voir — en vrai et chez toi — ce que ça peut donner.",
      },
      {
        title: "On débriefe",
        text: "On fait le point ensemble, on ajuste, et on continue seulement si ça peut vraiment t'apporter des recettes.",
      },
    ],
  },

  proof: {
    testimonials: [
      {
        quote:
          "Trois semaines après le lancement, mon agenda était plein pour deux mois.",
        author: "Karim",
        role: "Plombier · Lyon",
      },
      {
        quote:
          "Je passais mes soirées à chercher des chantiers. Maintenant, ce sont les clients qui m'appellent.",
        author: "Sébastien",
        role: "Électricien · Nantes",
      },
      {
        quote:
          "En deux mois, j'ai signé trois rénovations complètes. Jamais eu ça avec les flyers.",
        author: "Thomas",
        role: "Maçon · Bordeaux",
      },
      {
        quote:
          "Le téléphone sonne — et ce sont de vraies demandes de devis, pas des curieux.",
        author: "Julien",
        role: "Chauffagiste · Toulouse",
      },
    ],
  },

  resource: {
    eyebrow: "Les 3 ressources offertes",
    title: "À récupérer avant de te présenter au rendez-vous",
    subtitle:
      "Trois ressources offertes pour arriver préparé : le guide complet, les 10 erreurs à éviter, et le calcul de ton retour.",
    button: "Télécharger",
    gifts: [
      {
        tag: "Le guide",
        title: "Comment Google Ads transforme un artisan",
        desc: "Les chiffres, les pièges, mes réalisations notées 93–97 par Google.",
        file: "/ressource-nmf-agence.pdf",
        meta: "PDF · 8 pages",
      },
      {
        tag: "La checklist",
        title: "10 erreurs qui brûlent ton budget",
        desc: "Vérifie que tu n'es pas dans le lot. Une seule suffit à tout gâcher.",
        file: "/cadeau-10-erreurs.pdf",
        meta: "PDF · 2 pages",
      },
      {
        tag: "Le mémo",
        title: "Estime ton retour en 5 minutes",
        desc: "Les bons chiffres + la formule pour calculer toi-même ton ROI.",
        file: "/cadeau-memo-budget.pdf",
        meta: "PDF · 2 pages",
      },
    ],
  },

  finalCta: {
    title: "On se parle très bientôt.",
    subtitle:
      "Note bien la date dans ton agenda et garde un œil sur tes mails : tu y trouveras le lien du rendez-vous. J'arrive avec un plan — tu repars avec des réponses.",
    button: "Revoir la présentation",
    reassurance: "Un imprévu ? Tu peux reprogrammer depuis ton mail de confirmation.",
  },
} as const;

// ──────────────────────────────────────────────────────────────
//  Questionnaire de R2 — édite CE fichier pour changer les questions.
//  Rempli À L'ISSUE de la LP /preparation, avant l'appel de décision.
//  Modèle : « Questionnaire deuxième appel » du programme (7 questions :
//  note du R1, objectif, budget, infos pour décider, engagement décision),
//  adapté aux artisans. Une étape = un écran, comme le formulaire R1.
// ──────────────────────────────────────────────────────────────

import type { Step } from "./form";

export const formR2 = {
  title: "Questionnaire avant le rendez-vous",
  intro: "7 questions, 2 minutes — pour préparer un rendez-vous sur mesure.",
  submitLabel: "Envoyer mes réponses",
} as const;

export const stepsR2: readonly Step[] = [
  {
    key: "nom_prenom",
    question: "Quel est ton nom et prénom ?",
    type: "text",
    required: true,
    placeholder: "Jean Dupont",
  },
  {
    key: "note_r1",
    question: "Quelle note mettrais-tu à notre premier échange ?",
    help: "0 = inutile, 10 = exactement ce qu'il te fallait.",
    type: "scale",
    required: true,
  },
  {
    key: "objectif",
    question:
      "Quel est ton objectif de chiffre d'affaires sur les prochaines semaines / prochains mois ?",
    type: "select",
    required: true,
    options: [
      "2 000 – 5 000 € / mois",
      "5 000 – 10 000 € / mois",
      "10 000 – 20 000 € / mois",
      "20 000 – 50 000 € / mois",
      "Plus de 50 000 € / mois",
    ],
  },
  {
    key: "budget_investissement",
    question:
      "Si, à notre prochain rendez-vous, je te présente une offre qui te permet d'atteindre cet objectif, combien serais-tu prêt à investir ?",
    type: "select",
    required: true,
    options: [
      "0 – 500 €",
      "500 – 1 000 €",
      "1 000 – 2 000 €",
      "2 000 – 3 000 €",
      "3 000 – 5 000 €",
      "Plus de 5 000 €",
    ],
  },
  {
    key: "infos_decision",
    question:
      "Pour prendre la meilleure décision possible, de quelles informations aurais-tu besoin ?",
    help: "Retours clients, garanties, détails sur la méthode, questions précises…",
    type: "textarea",
    required: true,
    placeholder: "Ce dont tu as besoin pour être sûr de ta décision…",
  },
  {
    key: "pret_a_decider",
    question:
      "Si l'offre te correspond et que tu as tous les éléments nécessaires, serais-tu prêt à prendre ta décision à la fin de notre appel ?",
    type: "yesno",
    required: true,
  },
  {
    key: "raison_hesitation",
    question: "Si tu as répondu non, pourquoi ?",
    help: "Si tu as répondu oui, tu peux passer cette question.",
    type: "textarea",
    required: false,
    placeholder: "Ce qui pourrait te retenir…",
  },
] as const;

export const TOTAL_STEPS_R2 = stepsR2.length;

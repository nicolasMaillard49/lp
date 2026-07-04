// ──────────────────────────────────────────────────────────────
//  Formulaire "Audit de situation" — édite CE fichier pour changer
//  les questions, options et fourchettes. Une étape = un écran.
// ──────────────────────────────────────────────────────────────

import { site } from "./site";

export const form = {
  title: "Formulaire de diagnostic",
  intro: "Obtiens un audit gratuit de ta situation. Ça prend 2 minutes.",
  submitLabel: "Recevoir mon audit",
  /** Redirection après soumission. */
  redirectTo: "/bienvenue",
  /** Avertissement affiché en tête du formulaire. */
  disclaimerTitle: "ATTENTION : Vos réponses sont analysées.",
  disclaimer:
    "Nous nous réservons le droit d'annuler l'appel selon les éléments fournis, notamment concernant vos objectifs, votre capacité d'investissement et votre volonté d'avancer sur vos problématiques actuelles.",
} as const;

/** Type d'écran de chaque étape. */
export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "select"
  | "choice"
  | "yesno"
  | "stars";

export interface Step {
  /** Clé = colonne Supabase. */
  key: string;
  /** Numéro d'étape (1-indexé). */
  question: string;
  help?: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: readonly string[];
}

export const steps: readonly Step[] = [
  {
    key: "nom_prenom",
    question: "Quel est ton nom et prénom ?",
    type: "text",
    required: true,
    placeholder: "Jean Dupont",
  },
  {
    key: "email",
    question: "Ton adresse email ?",
    help: "Pour t'envoyer ton audit et les détails du rendez-vous.",
    type: "email",
    required: true,
    placeholder: "jean@exemple.fr",
  },
  {
    key: "ville",
    question: "Dans quelle ville exerces-tu ?",
    type: "text",
    required: true,
    placeholder: "Bordeaux",
  },
  {
    key: "telephone",
    question: "Ton numéro de téléphone ?",
    help: "Pour te rappeler avant le rendez-vous.",
    type: "tel",
    required: true,
    placeholder: "06 12 34 56 78",
  },
  {
    key: "instagram",
    question: "Ton compte Instagram ? (optionnel)",
    help: "Si tu en as un — pour jeter un œil à ta présence en ligne.",
    type: "text",
    required: false,
    placeholder: "@ton_pseudo",
  },
  {
    key: "activite",
    question: "Quelle est ton activité ?",
    type: "select",
    required: true,
    options: [...site.metiers, "Autre"],
  },
  {
    key: "ca_actuel",
    question: "À quel stade d'évolution se situe ton activité aujourd'hui ?",
    type: "select",
    required: true,
    options: [
      "2 000 – 4 000 € / mois",
      "4 000 – 8 000 € / mois",
      "8 000 – 12 000 € / mois",
      "12 000 – 20 000 € / mois",
      "Plus de 20 000 € / mois",
    ],
  },
  {
    key: "ca_objectif",
    question: "Jusqu'où veux-tu faire grandir ton activité ?",
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
    key: "problematique",
    question:
      "Quelle est sincèrement, selon toi, la plus grosse problématique qui t'empêche de l'atteindre ?",
    type: "choice",
    required: true,
    options: [
      "Manque de compétences en acquisition",
      "Manque de compétences en vente",
      "Manque de stratégie",
      "Je ne sais pas déléguer",
    ],
  },
  {
    key: "reglable_seul",
    question: "Penses-tu être en mesure de régler cette problématique seul ?",
    type: "yesno",
    required: true,
  },
  {
    key: "experience_digital",
    question: "Comment décrirais-tu ton expérience avec le digital ?",
    help: "0 étoile = aucune expérience.",
    type: "stars",
    required: true,
  },
] as const;

export const TOTAL_STEPS = steps.length;

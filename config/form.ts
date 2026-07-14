// ──────────────────────────────────────────────────────────────
//  Formulaire "Audit de situation" — édite CE fichier pour changer
//  les questions, options et fourchettes. Une étape = un écran.
//
//  ORDRE (refonte 2026-07-14) : on QUALIFIE d'abord, on demande le
//  CONTACT en dernier. Le contact est le champ le plus cher du form ;
//  l'ancienne version le réclamait en Q1-Q4 (nom/email/ville/tél),
//  donc avant d'avoir rien donné en échange.
//
//  Le form n'a pas de longueur fixe : il déduit ses écrans de ce qu'on
//  sait déjà (voir `Known` / `visibleSteps`). Sur le parcours ads, le
//  simulateur a déjà capté métier, ville et budget.
// ──────────────────────────────────────────────────────────────

import { site } from "./site";

export const form = {
  title: "Formulaire de diagnostic",
  intro: "Obtiens un audit gratuit de ta situation. Ça prend 2 minutes.",
  submitLabel: "Recevoir mon audit",
  /** Redirection après soumission. */
  redirectTo: "/bienvenue",
  /** Avertissement — affiché seulement à partir de la phase `contact`. */
  disclaimerTitle: "ATTENTION : Vos réponses sont analysées.",
  disclaimer:
    "Nous nous réservons le droit d'annuler l'appel selon les éléments fournis, notamment concernant vos objectifs, votre capacité d'investissement et votre volonté d'avancer sur vos problématiques actuelles.",
} as const;

/** Type d'écran de chaque étape. */
export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "tel"
  | "select"
  | "choice"
  | "yesno"
  | "stars"
  | "scale"; // note de 0 à 10

/**
 * `qualif` = on fait parler l'artisan de lui, friction faible.
 * `contact` = ses coordonnées. C'est là que le disclaimer a du sens :
 * la rareté ne pèse qu'au moment où on engage vraiment.
 */
export type Phase = "qualif" | "contact";

export interface Step {
  /** Clé = colonne Supabase. */
  key: string;
  question: string;
  help?: string;
  type: FieldType;
  required: boolean;
  /**
   * Optionnel : le type `Step` est partagé avec le questionnaire R2
   * (`config/form-r2.ts`), qui n'a pas ce découpage. Absent = `qualif`,
   * donc pas de disclaimer.
   */
  phase?: Phase;
  placeholder?: string;
  options?: readonly string[];
}

export const steps: readonly Step[] = [
  // ── Phase 1 — qualification ──────────────────────────────────
  {
    key: "activite",
    question: "Quelle est ton activité ?",
    type: "select",
    required: true,
    phase: "qualif",
    options: [...site.metiers, "Autre"],
  },
  {
    key: "ville",
    question: "Dans quelle ville exerces-tu ?",
    type: "text",
    required: true,
    phase: "qualif",
    placeholder: "Bordeaux",
  },
  {
    key: "ca_actuel",
    question: "À quel stade d'évolution se situe ton activité aujourd'hui ?",
    type: "select",
    required: true,
    phase: "qualif",
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
    phase: "qualif",
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
    phase: "qualif",
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
    phase: "qualif",
  },
  {
    key: "experience_digital",
    question: "Comment décrirais-tu ton expérience avec le digital ?",
    help: "0 étoile = aucune expérience.",
    type: "stars",
    required: true,
    phase: "qualif",
  },
  {
    key: "ouvert_accompagnement",
    question:
      "Si, à la fin de notre appel, je vois que je suis en mesure de t'aider dans ton activité à atteindre les objectifs que tu t'es fixés de manière 100 % garantie, serais-tu ouvert à l'idée de te faire accompagner ?",
    type: "yesno",
    required: true,
    phase: "qualif",
  },
  {
    key: "investir_financierement",
    question: "Es-tu prêt à t'investir financièrement pour régler ce problème ?",
    type: "yesno",
    required: true,
    phase: "qualif",
  },

  // ── Phase 2 — contact, une fois l'engagement acquis ──────────
  {
    key: "nom_prenom",
    question: "Quel est ton nom et prénom ?",
    type: "text",
    required: true,
    phase: "contact",
    placeholder: "Jean Dupont",
  },
  {
    key: "email",
    question: "Ton adresse email ?",
    help: "Pour t'envoyer ton audit et les détails du rendez-vous.",
    type: "email",
    required: true,
    phase: "contact",
    placeholder: "jean@exemple.fr",
  },
  {
    key: "telephone",
    question: "Ton numéro de téléphone ?",
    help: "Pour te rappeler avant le rendez-vous.",
    type: "tel",
    required: true,
    phase: "contact",
    placeholder: "06 12 34 56 78",
  },
  {
    key: "instagram",
    question: "Ton compte Instagram ? (optionnel)",
    help: "Si tu en as un — pour jeter un œil à ta présence en ligne.",
    type: "text",
    required: false,
    phase: "contact",
    placeholder: "@ton_pseudo",
  },
] as const;

export const TOTAL_STEPS = steps.length;

/**
 * Réponses déjà connues à l'entrée du formulaire — le simulateur en
 * fournit une partie sur le parcours ads. Clé = `Step.key`.
 */
export type Known = Readonly<Record<string, unknown>>;

/**
 * Les étapes qu'il reste à poser. Un seul composant sert ainsi le
 * parcours ads (court, le simulateur a déjà parlé) et l'organique
 * (complet) — sans dupliquer le formulaire.
 *
 * La qualification vit ICI en entier depuis le passage à Koalendar
 * (2026-07-15) : le booking est un calendrier pur (nom + email, zéro
 * question), donc plus aucun risque de demander deux fois.
 */
export function visibleSteps(known: Known = {}): Step[] {
  return steps.filter((s) => !(s.key in known));
}

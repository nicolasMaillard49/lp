// Types partagés entre l'API stats (serveur) et le dashboard (client).

export interface Bucket {
  label: string;
  count: number;
}

export interface FunnelStep {
  step: number;
  label: string;
  answered: number;
  abandonHere: number;
}

export interface AnswerInsight {
  key: string;
  question: string;
  type: "select" | "choice" | "yesno" | "stars" | "scale";
  buckets: Bucket[];
  average?: number; // étoiles (0..5) ou note (0..10)
}

export interface TimePoint {
  date: string; // YYYY-MM-DD
  visits: number;
  submissions: number;
}

export type ActivationMetricKey =
  | "visits"
  | "simUsed"
  | "resultViewed"
  | "ctaViewed"
  | "ctaClicked"
  | "estimateRequested"
  | "formOpened"
  | "started"
  | "completed";

export interface ActivationFunnelStep {
  key: ActivationMetricKey;
  label: string;
  count: number;
  rateFromPrevious: number | null; // 0..1, null pour la première étape
  rateFromVisits: number; // 0..1
}

export interface ActivationTimePoint {
  date: string; // YYYY-MM-DD, cohorte créée ce jour-là
  visits: number;
  uniqueVisitors: number;
  simUsed: number;
  resultViewed: number;
  ctaViewed: number;
  ctaClicked: number;
  estimateRequested: number;
  formOpened: number;
  started: number;
  completed: number;
}

export interface LeadRow {
  id: string;
  created_at: string;
  nom_prenom: string | null;
  email: string | null;
  ville: string | null;
  telephone: string | null;
  activite: string | null;
  ca_actuel: string | null;
  ca_objectif: string | null;
  problematique: string | null;
  reglable_seul: boolean | null;
  experience_digital: number | null;
  ouvert_accompagnement: boolean | null;
  investir_financierement: boolean | null;
  utm_campaign: string | null;
}

export interface EstimateRow {
  id: string;
  requested_at: string;
  email: string | null;
  activite: string | null;
  ville: string | null;
  sim_ca_estime: number | null;
  utm_campaign: string | null;
}

/** Ligne du tableau des réponses au questionnaire R2. */
export interface R2LeadRow {
  created_at: string;
  nom_prenom: string | null;
  note_r1: number | null;
  objectif: string | null;
  budget_investissement: string | null;
  infos_decision: string | null;
  pret_a_decider: boolean | null;
  raison_hesitation: string | null;
  utm_campaign: string | null;
}

/** Stats du questionnaire R2 (onglet dédié du dashboard). */
export interface R2Stats {
  configured: boolean;
  totals: {
    visits: number;
    started: number;
    completed: number;
    completionRate: number; // 0..1 (completed / started)
    medianDurationSec: number | null;
    averageNote: number | null; // note moyenne du R1 (0..10)
    readyToDecide: number; // pret_a_decider = true
  };
  funnel: FunnelStep[];
  answerInsights: AnswerInsight[];
  timeseries: TimePoint[];
  leads: R2LeadRow[];
}

export interface Stats {
  configured: boolean;
  activationMeasuredSince: string | null;
  totals: {
    visits: number;
    uniqueVisitors: number;
    /** A manipulé le simulateur (métier, ville ou slider) — flag sim_used. */
    simUsed: number;
    /** Le formulaire s'est affiché (clic CTA ou /audit direct) — flag form_opened. */
    formOpened: number;
    scroll25: number;
    scroll50: number;
    scroll75: number;
    resultViewed: number;
    ctaViewed: number;
    ctaClicked: number;
    estimateRequested: number;
    started: number;
    completed: number;
    completionRate: number; // 0..1 (completed / started)
    medianDurationSec: number | null;
    hotLeads: number;
  };
  activationFunnel: ActivationFunnelStep[];
  activationTimeseries: ActivationTimePoint[];
  funnel: FunnelStep[];
  answerInsights: AnswerInsight[];
  sources: Bucket[];
  campaigns: Bucket[];
  devices: Bucket[];
  browsers: Bucket[];
  os: Bucket[];
  countries: Bucket[];
  timeseries: TimePoint[];
  leads: LeadRow[];
  estimates: EstimateRow[];
}

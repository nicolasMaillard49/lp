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
  type: "select" | "choice" | "yesno" | "stars";
  buckets: Bucket[];
  average?: number; // étoiles
}

export interface TimePoint {
  date: string; // YYYY-MM-DD
  visits: number;
  submissions: number;
}

export interface LeadRow {
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
  utm_campaign: string | null;
}

export interface Stats {
  configured: boolean;
  totals: {
    visits: number;
    uniqueVisitors: number;
    started: number;
    completed: number;
    completionRate: number; // 0..1 (completed / started)
    medianDurationSec: number | null;
    hotLeads: number;
  };
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
}

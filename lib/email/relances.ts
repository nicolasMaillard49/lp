/* ──────────────────────────────────────────────────────────────
   Sélection des relances — logique PURE (aucun accès base), le
   cron lui donne les données et exécute son plan. Règles :
   - âge = 1ʳᵉ capture de l'email ; snapshot/token = ligne la plus
     récente (son dernier réglage) ;
   - suppression : désabonné, RDV pris, déjà envoyé, > 30 j ;
   - au plus UNE relance par email et par run : J+5 prime, et une
     fenêtre J+2 manquée (âge ≥ 5 j) ne s'envoie plus jamais.
   ────────────────────────────────────────────────────────────── */

export const DAY = 86_400_000;
const MAX_AGE = 30 * DAY;

export type EtudeRow = {
  email: string;
  snapshot: Record<string, unknown> | null;
  created_at: string;
  unsub_token: string;
  unsubscribed_at: string | null;
};

export type RelanceKind = "relance-j2" | "relance-j5";

export type RelancePlan = {
  email: string;
  kind: RelanceKind;
  snapshot: Record<string, unknown> | null;
  unsubToken: string;
};

export function planRelances(args: {
  rows: EtudeRow[];
  /** Emails (minuscules) présents dans audit_leads en status completed. */
  completedEmails: Set<string>;
  /** Entrées `email|kind` (email minuscules) déjà dans email_log. */
  logged: Set<string>;
  now: Date;
}): RelancePlan[] {
  const byEmail = new Map<string, EtudeRow[]>();
  for (const row of args.rows) {
    const key = row.email.trim().toLowerCase();
    if (!key) continue;
    const list = byEmail.get(key);
    if (list) list.push(row);
    else byEmail.set(key, [row]);
  }

  const plans: RelancePlan[] = [];
  for (const [email, rows] of byEmail) {
    if (args.completedEmails.has(email)) continue;
    if (rows.some((r) => r.unsubscribed_at)) continue;

    const sorted = [...rows].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const first = new Date(sorted[0].created_at).getTime();
    if (!Number.isFinite(first)) continue;
    const age = args.now.getTime() - first;
    if (age < 2 * DAY || age > MAX_AGE) continue;

    const kind: RelanceKind | null =
      age >= 5 * DAY
        ? args.logged.has(`${email}|relance-j5`)
          ? null
          : "relance-j5"
        : args.logged.has(`${email}|relance-j2`)
          ? null
          : "relance-j2";
    if (!kind) continue;

    const latest = sorted[sorted.length - 1];
    plans.push({ email, kind, snapshot: latest.snapshot, unsubToken: latest.unsub_token });
  }
  return plans;
}

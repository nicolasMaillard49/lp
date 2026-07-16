import "server-only";
import { getSupabase } from "@/lib/supabase";
import type { EmailKind, SendResult } from "./client";

/* Journal des envois — voir la migration 0006. Deux usages :
   - logEmail : trace après coup (emails directs, sans unicité) ;
   - claimRelance/settleRelance : « réserver puis envoyer » pour les
     relances — l'insert PREND le verrou (index unique partiel), un
     échec d'envoi REND le verrou (delete) pour retenter au cron
     suivant. Le double envoi est impossible au niveau base.
   Un crash entre claim et settle laisse un claim orphelin (ok=false) ;
   le cron balaie ces orphelins de plus d'1 h au début de chaque run —
   la relance est décalée d'un jour, jamais perdue. (Cas limite
   assumé : envoi réussi + settle en échec → renvoi le lendemain —
   l'at-least-once est le bon compromis ici.) */

export const EMAIL_LOG_TABLE = "email_log";

export async function logEmail(entry: {
  email: string;
  kind: EmailKind;
  refId?: string | null;
  result: SendResult;
}): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.from(EMAIL_LOG_TABLE).insert({
    email: entry.email.toLowerCase(),
    kind: entry.kind,
    ref_id: entry.refId ?? null,
    ok: entry.result.sent,
    provider_id: entry.result.sent ? entry.result.providerId : null,
    error: entry.result.sent ? null : entry.result.reason,
  });
  if (error) console.error("[email/log]", error.message);
}

/** Réserve le créneau d'envoi. null = déjà pris (ou erreur) → ne pas envoyer. */
export async function claimRelance(
  email: string,
  kind: "relance-j2" | "relance-j5"
): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(EMAIL_LOG_TABLE)
    .insert({ email: email.toLowerCase(), kind, ok: false })
    .select("id")
    .single();
  if (error) {
    // 23505 = violation d'unicité : claim déjà pris, course normale.
    if (error.code !== "23505") console.error("[email/log] claim", error.message);
    return null;
  }
  if (!data) return null;
  return String(data.id);
}

/** Solde le claim : envoyé → ok=true ; échec → delete (retente demain). */
export async function settleRelance(claimId: string, result: SendResult): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  if (result.sent) {
    const { error } = await supabase
      .from(EMAIL_LOG_TABLE)
      .update({ ok: true, provider_id: result.providerId, error: null })
      .eq("id", claimId);
    if (error) console.error("[email/log] settle", error.message);
  } else {
    const { error } = await supabase.from(EMAIL_LOG_TABLE).delete().eq("id", claimId);
    if (error) console.error("[email/log] release", error.message);
  }
}

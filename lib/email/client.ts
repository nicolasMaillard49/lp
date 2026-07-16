import "server-only";

/* ──────────────────────────────────────────────────────────────
   Unique porte de sortie email — API HTTP Resend en fetch direct
   (pas de SDK : un POST JSON suffit).

   Contrat : NE JETTE JAMAIS. Sans clé → log console + {sent:false,
   reason:"no-key"} (tout le parcours tourne à vide en dev). Un
   échec d'envoi ne doit jamais casser la réponse HTTP de la route
   appelante — l'appelant logge le résultat dans email_log.
   ────────────────────────────────────────────────────────────── */

export type EmailKind =
  | "etude"
  | "confirmation"
  | "notif-interne"
  | "relance-j2"
  | "relance-j5";

export type SendResult =
  | { sent: true; providerId: string | null }
  | { sent: false; reason: string };

const FROM_FALLBACK = "NMF Agence <contact@nmf-agence.com>";

/** On répond à Nicolas, pas à un trou noir : jamais de noreply en Reply-To. */
const REPLY_TO = "contact@nmf-agence.com";

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  /** URL de désinscription → en-têtes List-Unsubscribe (one-click Gmail/Yahoo). */
  unsubUrl?: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[email] RESEND_API_KEY absente — envoi sauté :", args.to, "·", args.subject);
    return { sent: false, reason: "no-key" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? FROM_FALLBACK,
        reply_to: process.env.RESEND_REPLY_TO ?? REPLY_TO,
        to: args.to,
        subject: args.subject,
        html: args.html,
        ...(args.unsubUrl
          ? {
              headers: {
                "List-Unsubscribe": `<${args.unsubUrl}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
              },
            }
          : {}),
      }),
      // Un Resend dégradé ne doit jamais épingler une route au-delà de 10 s.
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { sent: false, reason: `http ${res.status}: ${text.slice(0, 300)}` };
    }
    const data = (await res.json().catch(() => null)) as { id?: string } | null;
    return { sent: true, providerId: data?.id ?? null };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : "unknown" };
  }
}

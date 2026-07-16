import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/client";
import { sampleEmails } from "../samples";

/* Envoi de test des 5 emails vers NOTIF_EMAIL — DEV UNIQUEMENT.
   La préview en iframe montre le HTML ; seul un vrai envoi montre ce
   que Gmail/Outlook en font (rognage des styles, rendu mobile, spam).

   Rien n'est écrit dans email_log : ce sont des envois de test, ils
   n'ont pas à polluer le journal du parcours réel. */

export const runtime = "nodejs";
export const maxDuration = 60;

const PREFIX = "[TEST] ";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  }

  const to = process.env.NOTIF_EMAIL;
  if (!to) {
    return NextResponse.json(
      { ok: false, error: "NOTIF_EMAIL absent de .env.local" },
      { status: 500 }
    );
  }

  const results = [];
  for (const mail of sampleEmails()) {
    /* Séquentiel : Resend limite à ~2 requêtes/s. */
    const result = await sendEmail({
      to,
      subject: PREFIX + mail.subject,
      html: mail.html,
    });
    results.push({
      titre: mail.title,
      destinataire_reel: mail.audience === "prospect" ? "l'artisan" : "toi",
      objet: PREFIX + mail.subject,
      ...(result.sent ? { envoye: true } : { envoye: false, raison: result.reason }),
    });
  }

  const envoyes = results.filter((r) => r.envoye).length;
  return NextResponse.json({ ok: true, to, envoyes, total: results.length, results });
}

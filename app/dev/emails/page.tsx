import { notFound } from "next/navigation";
import { sampleEmails } from "./samples";

/* Préview des 5 emails du parcours — DEV UNIQUEMENT (notFound() en
   prod). Les templates sont des fonctions pures : on les rend ici
   avec des données d'exemple, sans clé, sans envoi.

   Pour les recevoir pour de vrai dans sa boîte (rendu Gmail réel) :
   GET /dev/emails/send. */

export const dynamic = "force-dynamic";

export default function DevEmailsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const items = sampleEmails();

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 16px", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Parcours email — préview dev</h1>
      <p style={{ color: "#666", marginBottom: 8 }}>
        Rendu exact des 5 emails (données d&apos;exemple). Rien n&apos;est envoyé depuis cette page.
      </p>
      <p style={{ color: "#666", marginBottom: 32, fontSize: 14 }}>
        Pour les recevoir dans ta boîte (rendu Gmail réel) :{" "}
        <a href="/dev/emails/send" style={{ color: "#1c4fd8", fontWeight: 700 }}>
          /dev/emails/send
        </a>
      </p>
      {items.map((item) => (
        <section key={item.title} style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 16, marginBottom: 4 }}>
            {item.title}{" "}
            <span style={{ fontWeight: 400, fontSize: 12, color: "#888" }}>
              → {item.audience === "prospect" ? "l'artisan" : "toi"}
            </span>
          </h2>
          <p style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
            Objet : <strong>{item.subject}</strong>
          </p>
          <iframe
            srcDoc={item.html}
            title={item.title}
            style={{ width: "100%", height: 900, border: "1px solid #ddd", background: "#fff" }}
          />
        </section>
      ))}
    </main>
  );
}

import { describe, expect, it } from "vitest";
import { esc, fmtEuro, layout } from "@/lib/email/layout";

describe("esc", () => {
  it("échappe le HTML injecté", () => {
    expect(esc(`Bordeaux <script>alert("x")</script>`)).toBe(
      "Bordeaux &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
    );
  });
});

describe("fmtEuro", () => {
  it("format fr avec arrondi", () => {
    // toLocaleString fr-FR utilise l'espace insécable étroite comme séparateur
    expect(fmtEuro(1499.6)).toMatch(/^1\s?500 €$/u);
    expect(fmtEuro(-143)).toBe("-143 €");
  });
});

describe("layout", () => {
  it("enveloppe le corps, footer sans désinscription par défaut", () => {
    const html = layout({ preheader: "Aperçu", body: "<p>CORPS</p>" });
    expect(html).toContain("<p>CORPS</p>");
    expect(html).toContain("NMF Agence");
    expect(html).not.toContain("Ne plus recevoir");
  });

  it("ajoute le lien de désinscription quand une URL est fournie", () => {
    const html = layout({
      preheader: "Aperçu",
      body: "<p>x</p>",
      unsubUrl: "https://exemple.fr/api/unsub?t=abc",
    });
    expect(html).toContain('href="https://exemple.fr/api/unsub?t=abc"');
    expect(html).toContain("Ne plus recevoir");
  });
});

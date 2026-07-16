import { describe, expect, it } from "vitest";
import { bandeau, big, esc, fmtEuro, layout } from "@/lib/email/layout";

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

describe("bandeau", () => {
  it("porte le titre et garde un repli solide pour Outlook", () => {
    const html = bandeau("Il te reste " + big("892 €"), "Plombier à Bordeaux");
    expect(html).toContain("892 €");
    expect(html).toContain("Plombier à Bordeaux");
    // bgcolor = ce que voit Outlook, qui ignore linear-gradient
    expect(html).toContain('bgcolor="#FF7149"');
    expect(html).toContain("linear-gradient");
  });

  it("échappe le sous-titre", () => {
    expect(bandeau("x", `<script>y</script>`)).toContain("&lt;script&gt;");
  });
});

describe("layout", () => {
  it("enveloppe bandeau et corps, footer sans désinscription par défaut", () => {
    const html = layout({ preheader: "Aperçu", bande: "<tr><td>BANDE</td></tr>", body: "<p>CORPS</p>" });
    expect(html).toContain("BANDE");
    expect(html).toContain("<p>CORPS</p>");
    expect(html).toContain("NMF Agence");
    expect(html).toContain("contact@nmf-agence.com");
    expect(html).not.toContain("Ne plus recevoir");
  });

  it("ajoute le lien de désinscription quand une URL est fournie", () => {
    const html = layout({
      preheader: "Aperçu",
      bande: "",
      body: "<p>x</p>",
      unsubUrl: "https://exemple.fr/api/unsub?t=abc",
    });
    expect(html).toContain('href="https://exemple.fr/api/unsub?t=abc"');
    expect(html).toContain("Ne plus recevoir");
  });
});

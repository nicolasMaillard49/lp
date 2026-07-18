import { describe, expect, it } from "vitest";
import { bandeau, big, button, esc, fmtEuro, layout, para, row } from "@/lib/email/layout";

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
  it("porte le titre et utilise le bleu solide du simulateur", () => {
    const html = bandeau("Il te reste " + big("892 €"), "Plombier à Bordeaux");
    expect(html).toContain("892 €");
    expect(html).toContain("Plombier à Bordeaux");
    expect(html).toContain('bgcolor="#075ad8"');
  });

  it("échappe le sous-titre", () => {
    expect(bandeau("x", `<script>y</script>`)).toContain("&lt;script&gt;");
  });
});

describe("layout", () => {
  it("reprend la palette bleue du simulateur sans gradient ni corail", () => {
    const html = layout({
      preheader: "Aperçu",
      bande: bandeau("Ton étude", "Plombier à Bordeaux"),
      body: `${para("Tes chiffres.")}<table>${row("Budget", "1 500 €")}</table>${button("https://exemple.fr", "Continuer")}`,
    }).toLowerCase();

    expect(html).toContain("font-family:helvetica,arial,sans-serif");
    expect(html).toContain("#075ad8");
    expect(html).toContain("#071a33");
    expect(html).toContain("#ffffff");
    expect(html).toContain("#f7f9fc");
    expect(html).toContain("#d8e3f2");
    expect(html).not.toContain("gradient");
    expect(html).not.toMatch(/#(?:ff6d77|ff7149|ffa043|d33a32)/);
  });

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

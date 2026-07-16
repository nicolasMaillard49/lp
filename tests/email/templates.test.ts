import { describe, expect, it } from "vitest";
import { etudeEmail, isEtudeSnapshot } from "@/lib/email/templates/etude";

const SNAPSHOT = {
  metier: "Plombier",
  ville: "Bordeaux",
  budget: 1500,
  net: 892,
  roi: 1.6,
  ca: 4460,
  chantiers: 6,
};

describe("etudeEmail", () => {
  it("sujet et chiffres du snapshot", () => {
    const { subject, html } = etudeEmail({ snapshot: SNAPSHOT, unsubToken: "tok-1" });
    expect(subject).toBe("Ton étude Google Ads — Plombier à Bordeaux");
    expect(html).toContain("Plombier");
    expect(html).toContain("Bordeaux");
    expect(html).toMatch(/892\s?€/u);
    expect(html).toMatch(/1\s?500 €/u);
  });

  it("lien de désinscription avec le token", () => {
    const { html } = etudeEmail({ snapshot: SNAPSHOT, unsubToken: "tok-1" });
    expect(html).toContain("/api/unsub?t=tok-1");
  });

  it("échappe une ville hostile", () => {
    const { html } = etudeEmail({
      snapshot: { ...SNAPSHOT, ville: `Bordeaux <script>x</script>` },
      unsubToken: "tok-1",
    });
    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("isEtudeSnapshot", () => {
  it("accepte un snapshot complet", () => {
    expect(isEtudeSnapshot(SNAPSHOT)).toBe(true);
  });
  it("refuse null et les snapshots partiels", () => {
    expect(isEtudeSnapshot(null)).toBe(false);
    expect(isEtudeSnapshot({ metier: "Plombier", ville: "Bordeaux" })).toBe(false);
  });
});

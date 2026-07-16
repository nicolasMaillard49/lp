import { describe, expect, it } from "vitest";
import { etudeEmail, isEtudeSnapshot } from "@/lib/email/templates/etude";
import { confirmationEmail } from "@/lib/email/templates/confirmation";
import { notifInterneEmail } from "@/lib/email/templates/notif-interne";
import { relanceJ2Email, relanceJ5Email } from "@/lib/email/templates/relances";

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

describe("confirmationEmail", () => {
  it("personnalise avec le prénom", () => {
    const { subject, html } = confirmationEmail({ prenom: "Karim" });
    expect(subject).toBe("C'est noté — ton audit est en préparation");
    expect(html).toContain("Karim, tes réponses sont bien arrivées.");
    expect(html).toContain("/bienvenue?reserver=1");
  });

  it("fallback sans prénom", () => {
    const { html } = confirmationEmail({ prenom: null });
    expect(html).toContain("Tes réponses sont bien arrivées.");
  });
});

describe("notifInterneEmail", () => {
  it("sujet + champs renseignés seulement", () => {
    const { subject, html } = notifInterneEmail({
      lead: {
        nom_prenom: "Karim Benali",
        activite: "Plombier",
        ville: "Bordeaux",
        email: "karim@exemple.fr",
        problematique: "Pas assez de demandes <urgent>",
        reglable_seul: false,
        instagram: null,
        utm_source: "facebook",
      },
    });
    expect(subject).toBe("Nouveau lead — Karim Benali (Plombier · Bordeaux)");
    expect(html).toContain("karim@exemple.fr");
    expect(html).toContain("&lt;urgent&gt;"); // échappé
    expect(html).toContain("non"); // booléen lisible
    expect(html).not.toContain("Instagram"); // champ vide → pas de ligne
    expect(html).toContain("/admin");
  });

  it("sujet dégradé quand activité/ville manquent", () => {
    const { subject } = notifInterneEmail({ lead: { nom_prenom: "Test" } });
    expect(subject).toBe("Nouveau lead — Test (? · ?)");
  });
});

const SNAP_LOOSE: Record<string, unknown> = {
  metier: "Plombier",
  ville: "Bordeaux",
  budget: 1500,
  net: 892,
  roi: 1.6,
  ca: 4460,
  chantiers: 6,
};

describe("relanceJ2Email", () => {
  it("net positif → sujet avec le chiffre", () => {
    const { subject, html } = relanceJ2Email({ snapshot: SNAP_LOOSE, unsubToken: "tok-2" });
    expect(subject).toMatch(/^892 € par mois — ton étude t'attend$/u);
    expect(html).toContain("Plombier");
    expect(html).toContain("/api/unsub?t=tok-2");
  });

  it("net négatif ou snapshot nul → sujet générique", () => {
    expect(relanceJ2Email({ snapshot: { ...SNAP_LOOSE, net: -143 }, unsubToken: "t" }).subject).toBe(
      "Ton étude Google Ads t'attend"
    );
    expect(relanceJ2Email({ snapshot: null, unsubToken: "t" }).subject).toBe(
      "Ton étude Google Ads t'attend"
    );
  });
});

describe("relanceJ5Email", () => {
  it("intro avec chiffre + lien PDF + unsub", () => {
    const { subject, html } = relanceJ5Email({ snapshot: SNAP_LOOSE, unsubToken: "tok-5" });
    expect(subject).toBe("Le coût de l'attente");
    expect(html).toMatch(/892\s?€/u);
    expect(html).toContain("/cout-de-lattente.pdf");
    expect(html).toContain("/api/unsub?t=tok-5");
  });

  it("sans chiffre exploitable → intro générique", () => {
    const { html } = relanceJ5Email({ snapshot: null, unsubToken: "t" });
    expect(html).toContain("c'est de la marge qui ne rentre pas");
  });
});

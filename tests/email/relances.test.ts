import { describe, expect, it } from "vitest";
import { DAY, planRelances, type EtudeRow } from "@/lib/email/relances";

const NOW = new Date("2026-07-16T09:00:00Z");

function rowAt(daysAgo: number, over: Partial<EtudeRow> = {}): EtudeRow {
  return {
    email: "a@b.fr",
    snapshot: { metier: "Plombier", net: 892 },
    created_at: new Date(NOW.getTime() - daysAgo * DAY).toISOString(),
    unsub_token: "tok",
    unsubscribed_at: null,
    ...over,
  };
}

function plan(rows: EtudeRow[], over: Partial<Parameters<typeof planRelances>[0]> = {}) {
  return planRelances({
    rows,
    completedEmails: new Set(),
    logged: new Set(),
    now: NOW,
    ...over,
  });
}

describe("planRelances", () => {
  it("< 2 jours → rien", () => {
    expect(plan([rowAt(1)])).toEqual([]);
  });

  it("3 jours → J+2", () => {
    expect(plan([rowAt(3)])).toMatchObject([{ email: "a@b.fr", kind: "relance-j2" }]);
  });

  it("3 jours mais J+2 déjà loggée → rien", () => {
    expect(plan([rowAt(3)], { logged: new Set(["a@b.fr|relance-j2"]) })).toEqual([]);
  });

  it("6 jours, rien loggé → J+5 seulement (jamais deux le même jour)", () => {
    expect(plan([rowAt(6)])).toMatchObject([{ kind: "relance-j5" }]);
  });

  it("6 jours, J+5 loggée → rien (la fenêtre J+2 est passée)", () => {
    expect(plan([rowAt(6)], { logged: new Set(["a@b.fr|relance-j5"]) })).toEqual([]);
  });

  it("désabonné → rien", () => {
    expect(plan([rowAt(3, { unsubscribed_at: NOW.toISOString() })])).toEqual([]);
  });

  it("RDV pris (audit completed) → rien", () => {
    expect(plan([rowAt(3)], { completedEmails: new Set(["a@b.fr"]) })).toEqual([]);
  });

  it("> 30 jours → rien (anti-rafale du premier run)", () => {
    expect(plan([rowAt(31)])).toEqual([]);
  });

  it("plusieurs lignes même email → âge de la 1ʳᵉ capture, snapshot de la dernière", () => {
    const plans = plan([
      rowAt(3, { snapshot: { net: 100 }, unsub_token: "vieux" }),
      rowAt(1, { snapshot: { net: 892 }, unsub_token: "recent" }),
    ]);
    expect(plans).toMatchObject([
      { kind: "relance-j2", snapshot: { net: 892 }, unsubToken: "recent" },
    ]);
  });

  it("emails insensibles à la casse", () => {
    expect(
      plan([rowAt(3, { email: "A@B.fr" })], { completedEmails: new Set(["a@b.fr"]) })
    ).toEqual([]);
  });
});

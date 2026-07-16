import { afterEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "@/lib/email/client";

const ARGS = { to: "a@b.fr", subject: "Sujet", html: "<p>x</p>" };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("sendEmail", () => {
  it("sans RESEND_API_KEY → {sent:false, reason:'no-key'}, sans jeter", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    await expect(sendEmail(ARGS)).resolves.toEqual({ sent: false, reason: "no-key" });
  });

  it("réponse 200 → sent:true avec l'id provider", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ id: "em_123" }), { status: 200 }))
    );
    await expect(sendEmail(ARGS)).resolves.toEqual({ sent: true, providerId: "em_123" });
  });

  it("réponse 422 → sent:false avec le statut dans reason", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("invalid from", { status: 422 })));
    const r = await sendEmail(ARGS);
    expect(r.sent).toBe(false);
    if (!r.sent) expect(r.reason).toContain("422");
  });

  it("fetch qui jette → sent:false, jamais d'exception", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("réseau"))));
    const r = await sendEmail(ARGS);
    expect(r.sent).toBe(false);
    if (!r.sent) expect(r.reason).toBe("réseau");
  });
});

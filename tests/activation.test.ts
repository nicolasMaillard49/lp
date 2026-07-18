import { describe, expect, it } from "vitest";
import {
  activationMarksForScroll,
  isActivationMark,
  isValidEstimateEmail,
  normalizeEstimateEmail,
  isAuditEntrypoint,
  isSimulatorActivationSession,
} from "@/lib/activation";

describe("estimate email", () => {
  it("normalizes a valid address", () => {
    expect(normalizeEstimateEmail("  Nicolas@Example.COM ")).toBe("nicolas@example.com");
    expect(isValidEstimateEmail("  Nicolas@Example.COM ")).toBe(true);
  });

  it("rejects malformed or oversized addresses", () => {
    expect(isValidEstimateEmail("nicolas@" )).toBe(false);
    expect(isValidEstimateEmail("a".repeat(250) + "@x.fr")).toBe(false);
  });
});

describe("activation marks", () => {
  it("only accepts persisted funnel marks", () => {
    expect(isActivationMark("result_viewed")).toBe(true);
    expect(isActivationMark("submit")).toBe(false);
  });

  it("returns every crossed scroll threshold", () => {
    expect(activationMarksForScroll(0.24)).toEqual([]);
    expect(activationMarksForScroll(0.51)).toEqual(["scroll_25", "scroll_50"]);
    expect(activationMarksForScroll(1)).toEqual(["scroll_25", "scroll_50", "scroll_75"]);
  });
});

describe("activation cohort", () => {
  it("only accepts known entrypoints", () => {
    expect(isAuditEntrypoint("simulator")).toBe(true);
    expect(isAuditEntrypoint("audit")).toBe(true);
    expect(isAuditEntrypoint("other")).toBe(false);
  });

  it("keeps direct audit visits out of the simulator funnel", () => {
    expect(isSimulatorActivationSession("simulator")).toBe(true);
    expect(isSimulatorActivationSession("audit")).toBe(false);
    expect(isSimulatorActivationSession(null)).toBe(false);
  });
});

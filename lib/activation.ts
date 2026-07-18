export const ACTIVATION_MARKS = [
  "sim_used",
  "form_opened",
  "scroll_25",
  "scroll_50",
  "scroll_75",
  "result_viewed",
  "cta_viewed",
  "cta_clicked",
] as const;

export type ActivationMark = (typeof ACTIVATION_MARKS)[number];

export const AUDIT_ENTRYPOINTS = ["simulator", "audit", "r2"] as const;
export type AuditEntrypoint = (typeof AUDIT_ENTRYPOINTS)[number];

const ACTIVATION_MARK_SET = new Set<string>(ACTIVATION_MARKS);

export function isActivationMark(value: unknown): value is ActivationMark {
  return typeof value === "string" && ACTIVATION_MARK_SET.has(value);
}

export function isAuditEntrypoint(value: unknown): value is AuditEntrypoint {
  return typeof value === "string" && AUDIT_ENTRYPOINTS.includes(value as AuditEntrypoint);
}

export function normalizeEstimateEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidEstimateEmail(value: unknown): boolean {
  const email = normalizeEstimateEmail(value);
  return email.length > 3 && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function activationMarksForScroll(progress: number): ActivationMark[] {
  if (!Number.isFinite(progress)) return [];
  const marks: ActivationMark[] = [];
  if (progress >= 0.25) marks.push("scroll_25");
  if (progress >= 0.5) marks.push("scroll_50");
  if (progress >= 0.75) marks.push("scroll_75");
  return marks;
}

export function isSimulatorActivationSession(entrypoint: unknown): boolean {
  return entrypoint === "simulator";
}

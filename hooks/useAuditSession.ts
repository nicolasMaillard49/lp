"use client";

import { useCallback, useEffect, useRef } from "react";

const VISITOR_KEY = "nmf_audit_visitor";

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  // Fallback improbable (navigateurs très anciens).
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readAttribution() {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const pick = (k: string) => p.get(k) || undefined;
  return {
    referrer: document.referrer || undefined,
    utm_source: pick("utm_source"),
    utm_medium: pick("utm_medium"),
    utm_campaign: pick("utm_campaign"),
    utm_content: pick("utm_content"),
    utm_term: pick("utm_term"),
  };
}

type Payload = Record<string, unknown>;

function send(endpoint: string, payload: Payload) {
  try {
    fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* fire-and-forget */
  }
}

/* Le submit final, lui, se CONFIRME : c'est le lead. Timeout 8 s puis un
   retry (les mobiles perdent une requête sur un changement de réseau).
   Retourne true seulement si le serveur a répondu { ok: true } — c'est ce
   qui autorise AuditForm à rediriger sans risquer un Lead Meta compté
   pendant que la base est restée vide. */
async function sendConfirmed(endpoint: string, payload: Payload): Promise<boolean> {
  const attempt = async (): Promise<boolean> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      if (!res.ok) return false;
      const json = (await res.json().catch(() => null)) as { ok?: boolean } | null;
      return json?.ok === true;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  };
  if (await attempt()) return true;
  await new Promise((r) => setTimeout(r, 600));
  return attempt();
}

/** Jalons du funnel d'entrée — un flag posé une seule fois par session. */
export type FunnelMark = "sim_used" | "form_opened";

export type AuditSession = {
  progress: (lastStep: number, answers: Payload) => void;
  submit: (answers: Payload) => Promise<boolean>;
  mark: (event: FunnelMark) => void;
};

/**
 * Gère l'identité de session et l'envoi des events de tracking.
 *
 * `autoVisit` (défaut true) émet l'event `visit` au mount. Le passer à
 * `false` quand une session est déjà ouverte par un parent — sinon deux
 * sessions concurrentes seraient créées pour un seul visiteur.
 *
 * ⚠️ Où ce hook est appelé DÉFINIT ce que `visit` mesure. Jusqu'au
 * 2026-07-17 il n'était appelé que dans `AuditForm`, monté seulement après
 * le clic CTA : `visit` mesurait donc l'OUVERTURE DU FORMULAIRE, pas
 * l'arrivée sur la page. D'où 606 visites Meta pour 1 ligne en base — et
 * l'impossibilité totale de savoir où le trafic se perdait. Sur la LP il
 * est désormais appelé par `AcquisitionLp` (voir là-bas).
 */
export function useAuditSession(
  endpoint: string = "/api/audit",
  { autoVisit = true }: { autoVisit?: boolean } = {}
): AuditSession {
  const sessionId = useRef<string>("");
  const visitorId = useRef<string>("");
  const startedAt = useRef<number>(0);
  const maxStep = useRef<number>(0);

  useEffect(() => {
    sessionId.current = uuid();
    startedAt.current = Date.now();
    try {
      let v = localStorage.getItem(VISITOR_KEY);
      if (!v) {
        v = uuid();
        localStorage.setItem(VISITOR_KEY, v);
      }
      visitorId.current = v;
    } catch {
      visitorId.current = uuid();
    }
    if (!autoVisit) return;
    send(endpoint, {
      session_id: sessionId.current,
      visitor_id: visitorId.current,
      event: "visit",
      attribution: readAttribution(),
    });
  }, [endpoint, autoVisit]);

  const progress = useCallback(
    (lastStep: number, answers: Payload) => {
      if (!sessionId.current) return;
      maxStep.current = Math.max(maxStep.current, lastStep);
      send(endpoint, {
        session_id: sessionId.current,
        visitor_id: visitorId.current,
        event: "progress",
        last_step: maxStep.current,
        answers,
      });
    },
    [endpoint]
  );

  /* Dédup côté client : un jalon ne part qu'une fois par session — le
     visiteur peut toucher 40 fois les sliders, un seul event suffit. */
  const marked = useRef<Set<FunnelMark>>(new Set());
  const mark = useCallback(
    (event: FunnelMark) => {
      if (!sessionId.current || marked.current.has(event)) return;
      marked.current.add(event);
      send(endpoint, {
        session_id: sessionId.current,
        visitor_id: visitorId.current,
        event,
      });
    },
    [endpoint]
  );

  const submit = useCallback(
    (answers: Payload): Promise<boolean> => {
      if (!sessionId.current) return Promise.resolve(false);
      return sendConfirmed(endpoint, {
        session_id: sessionId.current,
        visitor_id: visitorId.current,
        event: "submit",
        answers,
        duration_seconds: Math.round((Date.now() - startedAt.current) / 1000),
      });
    },
    [endpoint]
  );

  return { progress, submit, mark };
}

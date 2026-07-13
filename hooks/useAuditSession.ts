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

/** Gère l'identité de session et l'envoi des events de tracking. */
export function useAuditSession(endpoint: string = "/api/audit") {
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
    send(endpoint, {
      session_id: sessionId.current,
      visitor_id: visitorId.current,
      event: "visit",
      attribution: readAttribution(),
    });
  }, [endpoint]);

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

  const submit = useCallback(
    (answers: Payload) => {
      if (!sessionId.current) return;
      send(endpoint, {
        session_id: sessionId.current,
        visitor_id: visitorId.current,
        event: "submit",
        answers,
        duration_seconds: Math.round((Date.now() - startedAt.current) / 1000),
      });
    },
    [endpoint]
  );

  return { progress, submit };
}

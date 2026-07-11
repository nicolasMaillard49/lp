"use client";

import { useEffect } from "react";
import { fbTrack } from "@/lib/fpixel";

/**
 * Déclenche l'événement Meta "Lead" à l'arrivée sur la VSL.
 * L'utilisateur n'atteint /bienvenue qu'après avoir complété le form iClosed
 * (ou l'audit on-site), donc cette page = la conversion.
 * Garde de session pour éviter les doublons sur refresh.
 */
export function TrackLead() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("nmf_lead_fired")) return;
      sessionStorage.setItem("nmf_lead_fired", "1");
    } catch {
      // sessionStorage indisponible → on déclenche quand même
    }
    fbTrack("Lead");
  }, []);

  return null;
}

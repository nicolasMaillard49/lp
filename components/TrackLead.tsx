"use client";

import { useEffect } from "react";
import { fbTrack } from "@/lib/fpixel";

/**
 * Déclenche l'événement Meta "Lead" à l'arrivée sur /bienvenue.
 * On n'atteint cette page qu'après avoir SOUMIS le form de diagnostic
 * (qualification + contact) : Lead = lead qualifié capté en base. Le
 * booking Koalendar se fait ensuite sur cette même page (BookingEmbed)
 * — la conversion ne dépend d'aucune redirection tierce.
 * Garde de session pour éviter les doublons sur refresh.
 */
export function TrackLead() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("nmf_lead_fired")) return;
    } catch {
      // sessionStorage indisponible → on déclenche quand même
    }
    // Le flag n'est posé que si fbq a bien reçu l'event (sinon on
    // retentera au prochain rendu/refresh au lieu de perdre le Lead).
    if (fbTrack("Lead")) {
      try {
        sessionStorage.setItem("nmf_lead_fired", "1");
      } catch {
        // ignore
      }
    }
  }, []);

  return null;
}

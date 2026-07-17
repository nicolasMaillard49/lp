"use client";

import { useEffect } from "react";
import { fbTrackCustom } from "@/lib/fpixel";

/**
 * Déclenche l'événement Meta personnalisé "PrepaR2" à l'arrivée sur la LP R2.
 * Un prospect qui atteint cette page a fait son R1 : c'est le signal le plus
 * chaud du funnel avant la vente. Garde de session pour éviter les doublons.
 */
export function TrackR2() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("nmf_r2_fired")) return;
    } catch {
      // sessionStorage indisponible → on déclenche quand même, sans garde.
    }
    /* Le flag SEULEMENT si l'event est parti (corrigé le 2026-07-17).
       L'ordre inverse était exactement le bug du 2026-07-13 sur `Lead` :
       flag posé → fbq pas encore prêt → event jamais émis → et le flag
       interdit toute nouvelle tentative. L'event est perdu pour de bon. */
    if (fbTrackCustom("PrepaR2")) {
      try {
        sessionStorage.setItem("nmf_r2_fired", "1");
      } catch {
        // Pas de garde possible : au pire un doublon, jamais une perte.
      }
    }
  }, []);

  return null;
}

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
      sessionStorage.setItem("nmf_r2_fired", "1");
    } catch {
      // sessionStorage indisponible → on déclenche quand même
    }
    fbTrackCustom("PrepaR2");
  }, []);

  return null;
}

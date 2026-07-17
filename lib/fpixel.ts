// Meta (Facebook) Pixel — NMF Agence
// Dataset "Pixel NMF" (compte pub ClipBag / business Nicolas Maillard)
export const FB_PIXEL_ID = "1075600641466805";

type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

/**
 * Déclenche un événement standard Meta (ex. "Lead", "Schedule").
 * No-op côté serveur ou si le pixel n'est pas encore chargé.
 */
export function fbTrack(event: string, params?: Record<string, unknown>): boolean {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", event, params);
    return true;
  }
  return false;
}

/**
 * Déclenche un événement personnalisé Meta (ex. "PrepaR2").
 * No-op côté serveur ou si le pixel n'est pas encore chargé.
 *
 * ⚠️ Retourne un booléen — comme `fbTrack`, et pour la même raison.
 * L'asymétrie (fbTrack: boolean / fbTrackCustom: void) rendait le bug du
 * 2026-07-13 IMPOSSIBLE à éviter pour les events custom : un appelant ne
 * pouvait pas savoir si son event était parti, donc il posait son flag
 * « déjà envoyé » à l'aveugle et perdait l'event pour de bon.
 * Tout appelant qui pose un flag de déduplication DOIT le conditionner à
 * ce retour. Voir TrackLead.tsx pour le motif correct.
 */
export function fbTrackCustom(event: string, params?: Record<string, unknown>): boolean {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("trackCustom", event, params);
    return true;
  }
  return false;
}

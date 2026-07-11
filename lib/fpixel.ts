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
export function fbTrack(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", event, params);
  }
}

import "server-only";

export interface RequestContext {
  device: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
}

/** Détecte device/browser/OS depuis le User-Agent + géo depuis les headers Vercel. */
export function readRequestContext(headers: Headers): RequestContext {
  const ua = headers.get("user-agent") ?? "";

  return {
    device: detectDevice(ua),
    browser: detectBrowser(ua),
    os: detectOs(ua),
    country: headers.get("x-vercel-ip-country"),
    // Villes/pays Vercel sont URL-encodés (ex. "San%20Francisco").
    city: decode(headers.get("x-vercel-ip-city")),
  };
}

function decode(v: string | null): string | null {
  if (!v) return null;
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

function detectDevice(ua: string): string | null {
  if (!ua) return null;
  if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return "tablet";
  if (/Android(?!.*Mobile)/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua)) return "mobile";
  return "desktop";
}

function detectBrowser(ua: string): string | null {
  if (!ua) return null;
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\/|Opera/i.test(ua)) return "Opera";
  if (/SamsungBrowser/i.test(ua)) return "Samsung Internet";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Chrome\//i.test(ua)) return "Chrome";
  if (/Safari\//i.test(ua)) return "Safari";
  return "Autre";
}

function detectOs(ua: string): string | null {
  if (!ua) return null;
  if (/Windows/i.test(ua)) return "Windows";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Mac OS X/i.test(ua)) return "macOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Linux/i.test(ua)) return "Linux";
  return "Autre";
}

export interface Attribution {
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

/** Nettoie l'attribution envoyée par le client (referrer + UTM). */
export function sanitizeAttribution(input: unknown): Attribution {
  const o = (input ?? {}) as Record<string, unknown>;
  const s = (v: unknown): string | null =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, 512) : null;

  return {
    referrer: s(o.referrer),
    utm_source: s(o.utm_source),
    utm_medium: s(o.utm_medium),
    utm_campaign: s(o.utm_campaign),
    utm_content: s(o.utm_content),
    utm_term: s(o.utm_term),
  };
}

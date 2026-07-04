// Auth admin minimaliste : un mot de passe → cookie signé (HMAC-SHA256).
// Utilisable en edge (middleware) ET node (route handlers) via Web Crypto.

export const ADMIN_COOKIE = "nmf_admin";
const ROLE = "admin";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

const encoder = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return toHex(sig);
}

/** Comparaison à temps constant (évite le timing attack). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Génère un token `admin.<exp>.<sig>`. */
export async function createToken(secret: string): Promise<string> {
  const exp = Date.now() + TTL_MS;
  const payload = `${ROLE}.${exp}`;
  const sig = await hmac(secret, payload);
  return `${payload}.${sig}`;
}

/** Vérifie signature + expiration. */
export async function verifyToken(
  token: string | undefined,
  secret: string
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, expStr, sig] = parts;
  if (role !== ROLE) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const expected = await hmac(secret, `${role}.${expStr}`);
  return safeEqual(sig, expected);
}

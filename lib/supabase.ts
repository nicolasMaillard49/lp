import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase côté serveur UNIQUEMENT (service_role).
 * Ne JAMAIS importer ce fichier dans un composant client.
 * La table `audit_leads` est en RLS deny-all : seule cette clé peut lire/écrire.
 */
let cached: SupabaseClient | null = null;

/** Renvoie le client, ou null si les variables d'env manquent (dev sans Supabase). */
export function getSupabase(): SupabaseClient | null {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY absents — writes désactivés (dev)."
      );
    }
    return null;
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export const AUDIT_TABLE = "audit_leads";

import { NextResponse, type NextRequest } from "next/server";
import communes from "@/lib/communes-fr.json";

export const runtime = "nodejs";
/* ⚠️ PAS de `force-static` : il fige la route au build, et
   `searchParams` revient alors toujours vide → 0 résultat.
   Les données sont figées, mais la REQUÊTE est dynamique. */
export const dynamic = "force-dynamic";

/**
 * Recherche de commune — les 34 957 communes de France, villages compris.
 *
 * Pourquoi une route serveur plutôt que geo.api.gouv.fr en direct :
 * l'API publique répond en ~1,4 s, ce qui est inutilisable pour de
 * l'autocomplétion à la frappe. Et pourquoi pas côté client : le jeu
 * complet pèse 888 Ko (315 Ko gzip), soit plus que toute la LP.
 * Ici : 0 Ko pour le visiteur, index construit une fois au démarrage.
 */

type Raw = [nom: string, pop: number, dept: string];
const DATA = communes as Raw[];

/** "Saint-Étienne" → "saintetienne". Doit rester identique à `normalizeVille`. */
function norm(v: string): string {
  return v.normalize("NFD").toLowerCase().replace(/[^a-z]/g, "");
}

/* Index construit une seule fois par instance, pas à chaque requête.
   Les données sont déjà triées par population décroissante : la
   première correspondance est donc la plus grande ville. */
const INDEX: { key: string; row: Raw }[] = DATA.map((row) => ({
  key: norm(row[0]),
  row,
}));

export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const key = norm(q);
  if (key.length < 2) return NextResponse.json({ communes: [] });

  const exact: Raw[] = [];
  const prefix: Raw[] = [];
  const contains: Raw[] = [];

  for (const { key: k, row } of INDEX) {
    if (k === key) exact.push(row);
    else if (k.startsWith(key)) prefix.push(row);
    else if (k.includes(key)) contains.push(row);
    /* Assez de candidats : la table étant triée par population, on tient
       déjà les plus grandes villes de chaque catégorie. */
    if (prefix.length >= 20 && contains.length >= 20) break;
  }

  /* Exact d'abord (« Brive » ne doit pas être noyé sous « Brives-sur-… »),
     puis les préfixes, puis les correspondances internes. */
  const out = [...exact, ...prefix, ...contains].slice(0, 7);
  return NextResponse.json({ communes: out });
}

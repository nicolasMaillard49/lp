-- Valeurs du simulateur attachées au lead (parcours ads).
-- Sans ces colonnes, l'API doit les jeter : un upsert avec une colonne
-- inconnue échoue en 500 et PERD le lead (cf. bug du 2026-07-07).
alter table audit_leads
  add column if not exists budget_ads integer,
  add column if not exists budget_lsa integer,
  add column if not exists sim_panier integer,
  add column if not exists sim_transfo integer,
  add column if not exists sim_ca_estime integer,
  add column if not exists sim_bassin integer;

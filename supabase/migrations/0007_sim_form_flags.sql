-- Funnel d'entrée avant la première réponse (2026-07-18).
-- « visit » dit qu'on est arrivé sur la LP ; entre l'arrivée et la
-- première réponse au form, on était aveugle. Deux jalons de plus,
-- posés sur la ligne de session existante :
--   sim_used    — a manipulé le simulateur (métier, ville ou un slider)
--   form_opened — le formulaire s'est affiché (clic CTA sur la LP,
--                 ou arrivée directe sur /audit)
alter table public.audit_leads
  add column if not exists sim_used    boolean not null default false,
  add column if not exists form_opened boolean not null default false;

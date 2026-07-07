-- Deux nouvelles questions de qualification en fin de formulaire.
alter table public.audit_leads
  add column if not exists ouvert_accompagnement   boolean,
  add column if not exists investir_financierement boolean;

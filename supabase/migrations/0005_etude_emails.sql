-- Emails « Reçois ton étude » capturés sous le simulateur (LP).
-- Filet sous le funnel : avant cette table, un abandon après le résultat
-- du simulateur = prospect perdu sans aucun moyen de recontact.
-- Insert-only (pas de brouillon upserté) : une ligne par envoi, le
-- snapshot jsonb fige les réglages du simulateur au moment de la capture
-- pour personnaliser la relance (« Tes X €/mois t'attendent »).

create table if not exists public.etude_emails (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  snapshot    jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists etude_emails_created_at_idx on public.etude_emails (created_at);
create index if not exists etude_emails_email_idx      on public.etude_emails (email);

-- RLS deny-all (même politique que audit_leads / r2_responses) :
-- lecture/écriture uniquement via la service_role key (routes serveur Next.js).
alter table public.etude_emails enable row level security;

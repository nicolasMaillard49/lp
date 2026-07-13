-- Réponses du questionnaire de R2 (LP /preparation → /preparation/questionnaire).
-- Même approche "brouillon upserté" que audit_leads : une ligne par session,
-- créée à l'ouverture du formulaire, mise à jour à chaque étape.

create table if not exists public.r2_responses (
  id                    uuid primary key default gen_random_uuid(),
  session_id            uuid not null unique,
  visitor_id            uuid,
  status                text not null default 'visited',   -- visited | started | completed
  last_step             int  not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  completed_at          timestamptz,
  duration_seconds      int,
  -- réponses
  nom_prenom            text,
  note_r1               int,        -- note du premier appel, 0 → 10
  objectif              text,
  budget_investissement text,
  infos_decision        text,
  pret_a_decider        boolean,
  raison_hesitation     text,
  -- attribution / device
  referrer              text,
  utm_source            text,
  utm_medium            text,
  utm_campaign          text,
  utm_content           text,
  utm_term              text,
  device                text,
  browser               text,
  os                    text,
  country               text,
  city                  text
);

create index if not exists r2_responses_status_idx     on public.r2_responses (status);
create index if not exists r2_responses_created_at_idx on public.r2_responses (created_at);

-- RLS deny-all : lecture/écriture uniquement via la service_role key.
alter table public.r2_responses enable row level security;

-- Maintien de updated_at (réutilise la fonction créée en 0001).
drop trigger if exists r2_responses_set_updated_at on public.r2_responses;
create trigger r2_responses_set_updated_at
  before update on public.r2_responses
  for each row execute function public.set_updated_at();

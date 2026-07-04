-- Table des leads du formulaire d'audit + tracking funnel.
-- Approche "brouillon upserté" : une ligne par visiteur (clé session_id),
-- créée au chargement, mise à jour à chaque étape.

create table if not exists public.audit_leads (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null unique,
  visitor_id          uuid,
  status              text not null default 'visited',   -- visited | started | completed
  last_step           int  not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  completed_at        timestamptz,
  duration_seconds    int,
  -- réponses
  nom_prenom          text,
  email               text,
  ville               text,
  telephone           text,
  instagram           text,
  activite            text,
  ca_actuel           text,
  ca_objectif         text,
  problematique       text,
  reglable_seul       boolean,
  experience_digital  int,
  -- attribution / device
  referrer            text,
  utm_source          text,
  utm_medium          text,
  utm_campaign        text,
  utm_content         text,
  utm_term            text,
  device              text,
  browser             text,
  os                  text,
  country             text,
  city                text
);

create index if not exists audit_leads_status_idx     on public.audit_leads (status);
create index if not exists audit_leads_created_at_idx  on public.audit_leads (created_at);
create index if not exists audit_leads_last_step_idx   on public.audit_leads (last_step);

-- RLS deny-all : aucune policy publique.
-- Lecture/écriture uniquement via la service_role key (routes serveur Next.js).
alter table public.audit_leads enable row level security;

-- Maintien de updated_at.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists audit_leads_set_updated_at on public.audit_leads;
create trigger audit_leads_set_updated_at
  before update on public.audit_leads
  for each row execute function public.set_updated_at();

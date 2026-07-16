-- Parcours email (spec 2026-07-16) : désinscription + journal d'envois.

-- 1) Désinscription sur etude_emails — les relances J+2/J+5 sont de la
--    prospection : lien de désinscription obligatoire (RGPD). Le token
--    évite l'email en clair dans l'URL. La désinscription vaut pour
--    l'EMAIL (toutes ses lignes), pas pour la ligne seule.
alter table public.etude_emails
  add column if not exists unsub_token uuid not null default gen_random_uuid(),
  add column if not exists unsubscribed_at timestamptz;

create index if not exists etude_emails_unsub_token_idx
  on public.etude_emails (unsub_token);

-- 2) Journal des envois — traçabilité + idempotence.
create table if not exists public.email_log (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  kind         text not null,   -- etude | confirmation | notif-interne | relance-j2 | relance-j5
  ref_id       uuid,            -- id de la ligne source (etude_emails / audit_leads)
  sent_at      timestamptz not null default now(),
  ok           boolean not null default false,
  provider_id  text,            -- id Resend si envoyé
  error        text
);

create index if not exists email_log_email_idx on public.email_log (email);

-- Le verrou anti-double-relance : l'unicité est garantie PAR LA BASE,
-- pas par le code (cron qui tourne deux fois, race, replay…).
create unique index if not exists email_log_relance_unique
  on public.email_log (email, kind)
  where kind in ('relance-j2', 'relance-j5');

-- RLS deny-all (même politique que audit_leads / r2_responses /
-- etude_emails) : lecture/écriture uniquement via la service_role key.
alter table public.email_log enable row level security;

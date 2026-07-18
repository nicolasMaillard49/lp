-- Jalons d'activation du simulateur (2026-07-19).
-- Une colonne par jalon garde les écritures idempotentes sur la session
-- existante et permet des agrégations simples dans le dashboard.
alter table public.audit_leads
  add column if not exists scroll_25             boolean not null default false,
  add column if not exists scroll_50             boolean not null default false,
  add column if not exists scroll_75             boolean not null default false,
  add column if not exists result_viewed         boolean not null default false,
  add column if not exists cta_viewed            boolean not null default false,
  add column if not exists cta_clicked           boolean not null default false,
  add column if not exists estimate_requested    boolean not null default false,
  add column if not exists estimate_requested_at timestamptz;

create index if not exists audit_leads_estimate_requested_idx
  on public.audit_leads (estimate_requested, estimate_requested_at desc);

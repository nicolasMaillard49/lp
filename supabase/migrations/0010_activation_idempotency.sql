-- Retry réseau idempotent et purge limitée à la session sélectionnée.

alter table public.etude_emails
  add column if not exists session_id uuid;

create unique index if not exists etude_emails_session_id_unique
  on public.etude_emails (session_id)
  where session_id is not null;

drop function if exists public.capture_estimate(uuid, uuid, text, jsonb, text, text, integer, integer, integer, integer, integer);

create function public.capture_estimate(
  p_session_id uuid,
  p_visitor_id uuid,
  p_email text,
  p_snapshot jsonb,
  p_activite text,
  p_ville text,
  p_budget_ads integer,
  p_budget_lsa integer,
  p_sim_panier integer,
  p_sim_transfo integer,
  p_sim_ca_estime integer
)
returns table(id uuid, unsub_token uuid, created boolean)
language plpgsql
set search_path = public
as $$
declare
  captured_id uuid;
  captured_token uuid;
  was_created boolean := false;
begin
  insert into public.audit_leads as lead (
    session_id, visitor_id, entrypoint, email, activite, ville,
    budget_ads, budget_lsa, sim_panier, sim_transfo, sim_ca_estime,
    estimate_requested, estimate_requested_at
  ) values (
    p_session_id, p_visitor_id, 'simulator', lower(p_email), p_activite, p_ville,
    p_budget_ads, p_budget_lsa, p_sim_panier, p_sim_transfo, p_sim_ca_estime,
    true, now()
  )
  on conflict (session_id) do update set
    visitor_id = coalesce(excluded.visitor_id, lead.visitor_id),
    entrypoint = 'simulator',
    email = excluded.email,
    activite = coalesce(excluded.activite, lead.activite),
    ville = coalesce(excluded.ville, lead.ville),
    budget_ads = coalesce(excluded.budget_ads, lead.budget_ads),
    budget_lsa = coalesce(excluded.budget_lsa, lead.budget_lsa),
    sim_panier = coalesce(excluded.sim_panier, lead.sim_panier),
    sim_transfo = coalesce(excluded.sim_transfo, lead.sim_transfo),
    sim_ca_estime = coalesce(excluded.sim_ca_estime, lead.sim_ca_estime),
    estimate_requested = true,
    estimate_requested_at = coalesce(lead.estimate_requested_at, now());

  insert into public.etude_emails as capture (session_id, email, snapshot)
  values (p_session_id, lower(p_email), p_snapshot)
  on conflict (session_id) where session_id is not null do nothing
  returning capture.id, capture.unsub_token into captured_id, captured_token;

  if captured_id is null then
    select capture.id, capture.unsub_token
      into captured_id, captured_token
    from public.etude_emails as capture
    where capture.session_id = p_session_id;
  else
    was_created := true;
  end if;

  return query select captured_id, captured_token, was_created;
end;
$$;

create or replace function public.purge_completed_lead(p_id uuid)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  target_email text;
  target_session uuid;
begin
  select lead.email, lead.session_id into target_email, target_session
  from public.audit_leads as lead
  where lead.id = p_id and lead.status = 'completed'
  for update;
  if not found then return false; end if;

  delete from public.email_log
  where ref_id = p_id
     or ref_id in (select capture.id from public.etude_emails as capture where capture.session_id = target_session);
  delete from public.etude_emails where session_id = target_session;
  delete from public.audit_leads where audit_leads.id = p_id;

  if target_email is not null
    and not exists (select 1 from public.audit_leads where lower(email) = lower(target_email))
    and not exists (select 1 from public.etude_emails where lower(email) = lower(target_email)) then
    delete from public.email_log where lower(email) = lower(target_email);
  end if;
  return true;
end;
$$;

create or replace function public.purge_estimate(p_id uuid)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  target_email text;
  target_session uuid;
begin
  select lead.email, lead.session_id into target_email, target_session
  from public.audit_leads as lead
  where lead.id = p_id and lead.estimate_requested = true and lead.status <> 'completed'
  for update;
  if not found then return false; end if;

  delete from public.email_log
  where ref_id = p_id
     or ref_id in (select capture.id from public.etude_emails as capture where capture.session_id = target_session);
  delete from public.etude_emails where session_id = target_session;
  delete from public.audit_leads where audit_leads.id = p_id;

  if target_email is not null
    and not exists (select 1 from public.audit_leads where lower(email) = lower(target_email))
    and not exists (select 1 from public.etude_emails where lower(email) = lower(target_email)) then
    delete from public.email_log where lower(email) = lower(target_email);
  end if;
  return true;
end;
$$;

revoke all on function public.capture_estimate(uuid, uuid, text, jsonb, text, text, integer, integer, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.capture_estimate(uuid, uuid, text, jsonb, text, text, integer, integer, integer, integer, integer) to service_role;

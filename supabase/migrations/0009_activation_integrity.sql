-- Cohorte fiable du simulateur et opérations contact transactionnelles.

alter table public.audit_leads
  add column if not exists entrypoint text;

create index if not exists audit_leads_entrypoint_created_at_idx
  on public.audit_leads (entrypoint, created_at desc);

create or replace function public.capture_estimate(
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
returns table(id uuid, unsub_token uuid)
language plpgsql
set search_path = public
as $$
begin
  insert into public.audit_leads as lead (
    session_id,
    visitor_id,
    entrypoint,
    email,
    activite,
    ville,
    budget_ads,
    budget_lsa,
    sim_panier,
    sim_transfo,
    sim_ca_estime,
    estimate_requested,
    estimate_requested_at
  ) values (
    p_session_id,
    p_visitor_id,
    'simulator',
    lower(p_email),
    p_activite,
    p_ville,
    p_budget_ads,
    p_budget_lsa,
    p_sim_panier,
    p_sim_transfo,
    p_sim_ca_estime,
    true,
    now()
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
    estimate_requested_at = now();

  return query
    insert into public.etude_emails as capture (email, snapshot)
    values (lower(p_email), p_snapshot)
    returning capture.id, capture.unsub_token;
end;
$$;

create or replace function public.purge_completed_lead(p_id uuid)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  target_email text;
begin
  select lead.email into target_email
  from public.audit_leads as lead
  where lead.id = p_id and lead.status = 'completed'
  for update;

  if not found then return false; end if;

  if target_email is not null then
    delete from public.etude_emails where lower(email) = lower(target_email);
    delete from public.email_log where lower(email) = lower(target_email);
  end if;
  delete from public.audit_leads where audit_leads.id = p_id;
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
begin
  select lead.email into target_email
  from public.audit_leads as lead
  where lead.id = p_id
    and lead.estimate_requested = true
    and lead.status <> 'completed'
  for update;

  if not found then return false; end if;

  if target_email is not null then
    delete from public.etude_emails where lower(email) = lower(target_email);
    delete from public.email_log where lower(email) = lower(target_email);
  end if;
  delete from public.audit_leads where audit_leads.id = p_id;
  return true;
end;
$$;

revoke all on function public.capture_estimate(uuid, uuid, text, jsonb, text, text, integer, integer, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.purge_completed_lead(uuid) from public, anon, authenticated;
revoke all on function public.purge_estimate(uuid) from public, anon, authenticated;
grant execute on function public.capture_estimate(uuid, uuid, text, jsonb, text, text, integer, integer, integer, integer, integer) to service_role;
grant execute on function public.purge_completed_lead(uuid) to service_role;
grant execute on function public.purge_estimate(uuid) to service_role;

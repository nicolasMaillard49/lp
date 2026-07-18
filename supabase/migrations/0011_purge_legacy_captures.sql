-- Les captures antérieures à 0010 n'ont pas de session_id. Elles ne sont
-- purgées que lorsque le dernier dossier portant cet email disparaît.

create or replace function public.purge_legacy_email_after_audit_delete()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.email is null
    or exists (select 1 from public.audit_leads where lower(email) = lower(old.email)) then
    return old;
  end if;

  delete from public.email_log
  where ref_id in (
    select capture.id
    from public.etude_emails as capture
    where capture.session_id is null and lower(capture.email) = lower(old.email)
  );
  delete from public.etude_emails
  where session_id is null and lower(email) = lower(old.email);

  if not exists (select 1 from public.etude_emails where lower(email) = lower(old.email)) then
    delete from public.email_log where lower(email) = lower(old.email);
  end if;
  return old;
end;
$$;

drop trigger if exists audit_leads_purge_legacy_email on public.audit_leads;
create trigger audit_leads_purge_legacy_email
  after delete on public.audit_leads
  for each row execute function public.purge_legacy_email_after_audit_delete();

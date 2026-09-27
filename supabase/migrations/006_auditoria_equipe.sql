-- Auditoria imutável das alterações realizadas no painel da equipe.
create table if not exists public.staff_audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.staff_profiles(id),
  autor text not null,
  acao text not null,
  detalhe text not null default '',
  criado_em timestamptz not null default now()
);

alter table public.staff_audit_logs enable row level security;

drop policy if exists staff_audit_manager_read on public.staff_audit_logs;
create policy staff_audit_manager_read on public.staff_audit_logs
for select to authenticated
using (public.equipe_mfa_ok() and public.equipe_papel() in ('master','gerencial'));

create or replace function public.registrar_auditoria(p_acao text, p_detalhe text default '')
returns bigint
language plpgsql security definer set search_path = public
as $$
declare v_perfil public.staff_profiles%rowtype; v_id bigint;
begin
  if not public.equipe_mfa_ok() then raise exception 'TOTP obrigatório'; end if;
  select * into v_perfil from public.staff_profiles where auth_user_id = auth.uid() and ativo = true;
  if v_perfil.id is null then raise exception 'Usuário sem acesso ativo'; end if;
  insert into public.staff_audit_logs(user_id,autor,acao,detalhe)
  values(v_perfil.id,v_perfil.nome_completo,left(p_acao,300),left(coalesce(p_detalhe,''),1000))
  returning id into v_id;
  return v_id;
end $$;

revoke all on function public.registrar_auditoria(text,text) from public;
grant execute on function public.registrar_auditoria(text,text) to authenticated;
grant select on public.staff_audit_logs to authenticated;

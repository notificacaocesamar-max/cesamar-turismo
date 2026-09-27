-- Leitura segura do perfil do próprio funcionário após MFA.
-- Evita depender da avaliação combinada das políticas de staff_profiles.
create or replace function public.meu_perfil_equipe()
returns setof public.staff_profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  if not equipe_mfa_ok() then
    raise exception 'MFA obrigatório';
  end if;

  return query
    select p.*
      from public.staff_profiles p
     where p.auth_user_id = auth.uid()
       and p.ativo
     limit 1;
end;
$$;

revoke all on function public.meu_perfil_equipe() from public;
grant execute on function public.meu_perfil_equipe() to authenticated;

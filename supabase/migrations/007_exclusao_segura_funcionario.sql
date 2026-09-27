-- Exclusão lógica: encerra o acesso e o plantão sem apagar histórico/auditoria.
create or replace function public.excluir_funcionario(p_funcionario_id uuid)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare v_alvo public.staff_profiles%rowtype;
begin
  if not public.equipe_mfa_ok() or public.equipe_papel() not in ('master','gerencial') then
    raise exception 'Acesso gerencial com TOTP obrigatório';
  end if;
  select * into v_alvo from public.staff_profiles where id=p_funcionario_id for update;
  if v_alvo.id is null then raise exception 'Funcionário não encontrado'; end if;
  if v_alvo.papel='master' then raise exception 'O usuário Master não pode ser excluído'; end if;
  if v_alvo.auth_user_id=auth.uid() then raise exception 'Você não pode excluir o próprio acesso'; end if;
  update public.staff_profiles set ativo=false, pode_atender=false, recebe_leads=false, atualizado_em=now() where id=v_alvo.id;
  update public.duty_sessions set fim=coalesce(fim,now()), motivo_fim=coalesce(motivo_fim,'administrador') where user_id=v_alvo.id and fim is null;
  insert into public.staff_audit_logs(user_id,autor,acao,detalhe)
  select p.id,p.nome_completo,'usuário excluído',v_alvo.nome_completo||' <'||v_alvo.email||'>'
  from public.staff_profiles p where p.auth_user_id=auth.uid();
  return true;
end $$;

revoke all on function public.excluir_funcionario(uuid) from public;
grant execute on function public.excluir_funcionario(uuid) to authenticated;

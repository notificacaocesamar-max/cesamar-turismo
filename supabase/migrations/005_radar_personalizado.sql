create table if not exists public.radares_viagem (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(trim(nome)) between 3 and 120),
  destino text not null check (char_length(trim(destino)) between 2 and 160),
  periodo_inicio date not null,
  periodo_fim date not null check (periodo_fim >= periodo_inicio),
  telefone text not null check (telefone ~ '^[0-9]{10,15}$'),
  email text not null check (position('@' in email) > 1),
  orcamento numeric(12,2) not null check (orcamento >= 500),
  status text not null default 'novo' check (status in ('novo','em_monitoramento','contatado','encerrado')),
  email_enviado_em timestamptz,
  criado_em timestamptz not null default now()
);

alter table public.radares_viagem enable row level security;

create or replace function public.registrar_radar_viagem(
  p_nome text, p_destino text, p_periodo_inicio date, p_periodo_fim date,
  p_telefone text, p_email text, p_orcamento numeric
) returns uuid
language plpgsql security definer set search_path = public as $$
declare novo_id uuid;
begin
  if p_periodo_inicio < (current_date + interval '3 months')::date then
    raise exception 'A viagem deve ser planejada com pelo menos três meses de antecedência';
  end if;
  insert into public.radares_viagem(nome,destino,periodo_inicio,periodo_fim,telefone,email,orcamento)
  values(trim(p_nome),trim(p_destino),p_periodo_inicio,p_periodo_fim,regexp_replace(p_telefone,'\D','','g'),lower(trim(p_email)),p_orcamento)
  returning id into novo_id;
  return novo_id;
end $$;

revoke all on table public.radares_viagem from anon, authenticated;
grant execute on function public.registrar_radar_viagem(text,text,date,date,text,text,numeric) to anon, authenticated;

-- Equipe, plantão diário, distribuição de WhatsApp e leads do portal.
create table if not exists staff_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  nome_completo text not null,
  email text not null unique,
  whatsapp text check (whatsapp is null or whatsapp ~ '^55[1-9][0-9]{9,10}$'),
  papel text not null check (papel in ('master','gerencial','consultor')),
  ativo boolean not null default true,
  oculto boolean not null default false,
  pode_atender boolean not null default true,
  recebe_leads boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists duty_sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null references staff_profiles(id) on delete restrict,
  inicio timestamptz not null default now(),
  fim timestamptz,
  motivo_fim text check (motivo_fim is null or motivo_fim in ('usuario','virada_dia','administrador')),
  check (fim is null or fim >= inicio)
);
create unique index if not exists duty_one_open_per_user on duty_sessions(user_id) where fim is null;
create index if not exists duty_sessions_user_inicio on duty_sessions(user_id, inicio desc);

create table if not exists atendimento_distribuicoes (
  id bigint generated always as identity primary key,
  user_id uuid not null references staff_profiles(id),
  oferta_codigo text,
  destino text,
  criado_em timestamptz not null default now()
);

create table if not exists customer_leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(trim(nome)) between 2 and 120),
  quantidade_viajantes int not null check (quantidade_viajantes between 1 and 99),
  email text not null check (position('@' in email) > 1),
  telefone text not null check (telefone ~ '^[0-9]{10,15}$'),
  duracao_dias int check (duracao_dias between 1 and 365),
  mes_viagem int not null check (mes_viagem between 1 and 12),
  ano_viagem int not null check (ano_viagem between 2026 and 2100),
  oferta_codigo text,
  oferta_titulo text,
  oferta_url text,
  status text not null default 'novo' check (status in ('novo','em_atendimento','concluido','descartado')),
  atribuido_a uuid references staff_profiles(id) on delete set null,
  criado_em timestamptz not null default now()
);
create index if not exists customer_leads_status_criado on customer_leads(status, criado_em desc);

create or replace function equipe_papel() returns text
language sql stable security definer set search_path = public as $$
  select papel from staff_profiles where auth_user_id = auth.uid() and ativo;
$$;

create or replace function meu_funcionario_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from staff_profiles where auth_user_id = auth.uid() and ativo;
$$;

create or replace function equipe_mfa_ok() returns boolean
language sql stable as $$
  select auth.role() = 'authenticated' and coalesce(auth.jwt()->>'aal','aal1') = 'aal2';
$$;

create or replace function fechar_plantoes_vencidos() returns void
language plpgsql security definer set search_path = public as $$
declare corte timestamptz;
begin
  corte := ((now() at time zone 'America/Sao_Paulo')::date::timestamp at time zone 'America/Sao_Paulo');
  update duty_sessions
     set fim = corte - interval '1 second', motivo_fim = 'virada_dia'
   where fim is null and inicio < corte;
end $$;

create or replace function alternar_plantao(deseja_atender boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare p staff_profiles%rowtype;
begin
  if not equipe_mfa_ok() then raise exception 'MFA obrigatório'; end if;
  perform fechar_plantoes_vencidos();
  select * into p from staff_profiles where auth_user_id = auth.uid() and ativo;
  if p.id is null or not p.pode_atender or p.papel = 'master' then raise exception 'Usuário não pode entrar no plantão'; end if;
  update duty_sessions set fim = now(), motivo_fim = 'usuario' where user_id = p.id and fim is null;
  if deseja_atender then
    if p.whatsapp is null then raise exception 'Cadastre um WhatsApp válido antes de atender'; end if;
    insert into duty_sessions(user_id) values (p.id);
  end if;
  return deseja_atender;
end $$;

create or replace function meu_status_plantao() returns boolean
language plpgsql security definer set search_path = public as $$
begin
  perform fechar_plantoes_vencidos();
  return exists(select 1 from duty_sessions where user_id=meu_funcionario_id() and fim is null);
end $$;

create or replace function rotear_atendimento(p_oferta_codigo text default null, p_destino text default null)
returns table(encontrado boolean, nome text, whatsapp text)
language plpgsql security definer set search_path = public as $$
declare escolhido uuid;
begin
  perform fechar_plantoes_vencidos();
  select p.id into escolhido
    from staff_profiles p
    join duty_sessions s on s.user_id=p.id and s.fim is null
    left join lateral (
      select max(d.criado_em) ultimo from atendimento_distribuicoes d where d.user_id=p.id
    ) r on true
   where p.ativo and p.pode_atender and p.recebe_leads and p.papel in ('gerencial','consultor') and p.whatsapp is not null
   order by r.ultimo nulls first, s.inicio, p.id
   limit 1 for update of p;
  if escolhido is null then return query select false, null::text, null::text; return; end if;
  insert into atendimento_distribuicoes(user_id,oferta_codigo,destino) values(escolhido,p_oferta_codigo,p_destino);
  return query select true,p.nome_completo,p.whatsapp from staff_profiles p where p.id=escolhido;
end $$;

create or replace function registrar_lead(
  p_nome text, p_quantidade int, p_email text, p_telefone text, p_duracao int,
  p_mes int, p_ano int, p_oferta_codigo text, p_oferta_titulo text, p_oferta_url text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare novo_id uuid;
begin
  insert into customer_leads(nome,quantidade_viajantes,email,telefone,duracao_dias,mes_viagem,ano_viagem,oferta_codigo,oferta_titulo,oferta_url)
  values(trim(p_nome),p_quantidade,lower(trim(p_email)),regexp_replace(p_telefone,'\D','','g'),p_duracao,p_mes,p_ano,p_oferta_codigo,p_oferta_titulo,p_oferta_url)
  returning id into novo_id;
  return novo_id;
end $$;

alter table staff_profiles enable row level security;
alter table duty_sessions enable row level security;
alter table atendimento_distribuicoes enable row level security;
alter table customer_leads enable row level security;

create policy staff_self on staff_profiles for select to authenticated
  using (equipe_mfa_ok() and auth_user_id=auth.uid());
create policy staff_manager_read on staff_profiles for select to authenticated
  using (equipe_mfa_ok() and equipe_papel() in ('master','gerencial') and (not oculto or auth_user_id=auth.uid()));
create policy duty_self_read on duty_sessions for select to authenticated
  using (equipe_mfa_ok() and user_id=meu_funcionario_id());
create policy duty_manager_read on duty_sessions for select to authenticated
  using (equipe_mfa_ok() and equipe_papel() in ('master','gerencial') and not exists(select 1 from staff_profiles p where p.id=duty_sessions.user_id and p.oculto));
create policy leads_team_read on customer_leads for select to authenticated
  using (equipe_mfa_ok() and equipe_papel() in ('master','gerencial','consultor'));
create policy leads_team_update on customer_leads for update to authenticated
  using (equipe_mfa_ok() and equipe_papel() in ('master','gerencial','consultor'));

grant execute on function rotear_atendimento(text,text) to anon, authenticated;
grant execute on function registrar_lead(text,int,text,text,int,int,int,text,text,text) to anon, authenticated;
grant execute on function alternar_plantao(boolean) to authenticated;
grant execute on function meu_status_plantao() to authenticated;

create or replace function atualizar_meu_perfil(p_nome text, p_whatsapp text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not equipe_mfa_ok() then raise exception 'MFA obrigatório'; end if;
  if p_whatsapp !~ '^55[1-9][0-9]{9,10}$' then raise exception 'WhatsApp inválido'; end if;
  update staff_profiles set nome_completo=trim(p_nome), whatsapp=p_whatsapp, atualizado_em=now() where auth_user_id=auth.uid();
end $$;
grant execute on function atualizar_meu_perfil(text,text) to authenticated;

-- O Master é associado ao auth.users após o convite seguro:
-- insert into staff_profiles(auth_user_id,nome_completo,email,whatsapp,papel,oculto,pode_atender,recebe_leads)
-- values ('<auth-user-id>','Alexandre Rocha','alexandre.dirck@gmail.com','5521964898458','master',true,false,false);

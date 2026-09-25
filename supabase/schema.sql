-- ==========================================================================
-- Cesamar Turismo — banco no Supabase (PostgreSQL 15+)
-- Rodar no SQL Editor do Supabase (projeto novo). Modelos equivalentes a:
-- Destination, Airport, MonitoringRule, FlightSearch, FlightOffer, Campaign,
-- DestinationContent, Image, PricingRule, Consultant, WhatsAppClick, SystemLog
-- (+ histórico de preços, execuções do robô, eventos de métricas e configurações)
--
-- Segurança (RLS):
--   visitante (anon)      → lê só o que está publicado/ativo; só INSERE eventos de métricas
--   equipe (authenticated + admin_users) → lê e altera tudo pelo painel
--   robô (service_role)   → ignora RLS; a chave fica SÓ no Cloud Run (nunca no navegador)
-- ==========================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- equipe
create table if not exists admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  nome       text not null,
  papel      text not null default 'editor' check (papel in ('admin','editor')),
  criado_em  timestamptz not null default now()
);

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------- cadastros
create table if not exists destinations (
  id              text primary key,                       -- 'italia'
  sigla           text not null,                          -- 'ITA' (código da oferta)
  nome            text not null,                          -- 'Itália'
  nome_exibicao   text,                                   -- 'Orlando'
  artigo          text not null default '',               -- 'a', 'o', ''
  cidade          text not null,
  aeroporto       text not null,                          -- IATA de chegada
  regiao          text not null,
  ativo           boolean not null default true,
  ordem           int not null default 0,
  criado_em       timestamptz not null default now()
);

create table if not exists airports (
  iata          text primary key check (iata ~ '^[A-Z]{3}$'),
  nome          text not null,
  cidade        text,
  cidade_grupo  text not null,                            -- 'SAO', 'RIO' ou o próprio IATA
  pais          text,
  origem        boolean not null default false,
  ativo         boolean not null default true,
  constraint origem_so_sp_rj check (not origem or cidade_grupo in ('SAO','RIO'))
);

create table if not exists campaigns (
  id      text primary key,                               -- '15-anos', 'romanticos'…
  nome    text not null,
  titulo  text not null,
  texto   text not null,
  ativa   boolean not null default true,
  ordem   int not null default 0
);

create table if not exists destination_campaigns (
  destino_id   text references destinations(id) on delete cascade,
  campanha_id  text references campaigns(id) on delete cascade,
  primary key (destino_id, campanha_id)
);

create table if not exists destination_contents (
  destino_id        text primary key references destinations(id) on delete cascade,
  titulo_emocional  text not null,
  texto             text not null default '',
  motivos           jsonb not null default '[]',          -- ["...", "..."]
  faq               jsonb not null default '[]',          -- [{"p": "...", "r": "..."}]
  atualizado_em     timestamptz not null default now()
);

create table if not exists images (
  id            uuid primary key default gen_random_uuid(),
  destino_id    text not null references destinations(id) on delete cascade,
  url           text not null,                            -- Supabase Storage ou caminho do site
  alt           text not null,
  credito       text not null,
  principal     boolean not null default false,
  ordem         int not null default 1,
  demonstrativa boolean not null default false
);
create unique index if not exists images_uma_principal on images(destino_id) where principal;

create table if not exists monitoring_rules (
  id              text primary key,
  destino_id      text not null references destinations(id) on delete cascade,
  ativo           boolean not null default true,
  origens         text[] not null default '{SAO,RIO}' check (origens <@ array['SAO','RIO']),
  periodo_inicio  date not null,
  periodo_fim     date not null,
  duracao_min     int not null check (duracao_min > 0),
  duracao_max     int not null,
  max_escalas     int not null default 1 check (max_escalas between 0 and 3),
  exigir_bagagem  boolean not null default false,
  adultos         int not null default 1,
  classe          text not null default 'economica',
  combinacoes     int not null default 3 check (combinacoes between 1 and 3),
  check (periodo_fim >= periodo_inicio),
  check (duracao_max >= duracao_min)
);

create table if not exists pricing_rules (
  id                    text primary key,
  destino_id            text unique references destinations(id) on delete cascade,  -- null = regra padrão
  modo                  text check (modo in ('acrescimo','margem_final')),
  margem_pct            numeric(6,2),
  margem_minima_reais   numeric(12,2),
  taxas_variaveis_pct   numeric(6,2),
  custo_financeiro_pct  numeric(6,2),
  parcelas              int check (parcelas between 1 and 24),
  arredondamento        text check (arredondamento in ('nenhum','inteiro','dezena','centena','final_90')),
  pix_desconto_pct      numeric(6,2),
  juros_texto           text,
  entrada_texto         text
);
create unique index if not exists pricing_rules_uma_padrao on pricing_rules((destino_id is null)) where destino_id is null;

create table if not exists consultants (
  id          text primary key,
  nome        text not null,
  whatsapp    text,
  ativo       boolean not null default true,
  observacao  text
);

create table if not exists app_settings (                 -- whatsapp, textos gerais, parcelamento, robô
  chave       text primary key,
  valor       jsonb not null,
  publico     boolean not null default false,             -- true = o site pode ler
  atualizado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------- robô
create table if not exists robot_runs (
  id            text primary key,                         -- EXE-...
  provedor      text not null,
  inicio        timestamptz not null,
  fim           timestamptz,
  regras        int, novas int, atualizadas int, sem_alteracao int, expiradas int, erros int
);

create table if not exists flight_searches (
  id            text primary key,
  execucao_id   text references robot_runs(id) on delete set null,
  regra_id      text references monitoring_rules(id) on delete set null,
  destino_id    text references destinations(id) on delete set null,
  cidade_origem text not null check (cidade_origem in ('SAO','RIO')),
  tipo          text not null check (tipo in ('indicativa','ao_vivo')),
  resultados    int not null default 0,
  melhor_preco  numeric(12,2),
  criado_em     timestamptz not null default now()
);

create table if not exists flight_offers (
  id                  text primary key,
  codigo              text not null unique,               -- ITA-0527
  regra_id            text references monitoring_rules(id) on delete set null,
  destino_id          text not null references destinations(id),
  campanha_id         text references campaigns(id) on delete set null,
  status              text not null default 'aguardando_aprovacao'
                      check (status in ('rascunho','aguardando_aprovacao','publicado','expirado','pausado','rejeitado')),
  titulo              text not null,
  subtitulo           text not null,
  chamada             text not null,
  textos_auto         boolean not null default true,
  cidade_origem       text not null check (cidade_origem in ('SAO','RIO')),
  aeroporto_origem    text not null references airports(iata),
  aeroporto_destino   text not null references airports(iata),
  data_ida            date not null,
  data_volta          date not null check (data_volta > data_ida),
  companhia           text not null,
  escalas_ida         int not null default 0,
  escalas_volta       int not null default 0,
  classe              text not null default 'economica',
  bagagem             boolean not null default false,
  custo_original      numeric(12,2) not null check (custo_original > 0),  -- preço encontrado (NUNCA exibido)
  moeda               text not null default 'BRL',
  preco               jsonb not null,                     -- resultado do motor de preços (anunciado, pix, parcelas…)
  preco_anunciado     numeric(12,2) generated always as ((preco->>'precoParcelado')::numeric) stored,
  tipo_preco          text not null check (tipo_preco in ('ao_vivo','indicativo','manual','demonstrativo')),
  fonte               text not null,
  id_provedor         text,
  atualizacao_pendente jsonb,                             -- nova cotação aguardando aprovação
  pesquisado_em       timestamptz not null,
  publicado_em        timestamptz,
  aprovado_por        text,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now(),
  check (preco_anunciado >= custo_original)
);
create index if not exists flight_offers_status on flight_offers(status);

create table if not exists flight_offer_prices (           -- histórico de preços
  id              bigserial primary key,
  oferta_id       text not null references flight_offers(id) on delete cascade,
  data            timestamptz not null default now(),
  custo           numeric(12,2) not null,
  preco_anunciado numeric(12,2) not null,
  companhia       text, data_ida date, data_volta date, cidade_origem text,
  manual          boolean not null default false
);

create table if not exists system_logs (
  id           bigserial primary key,
  execucao_id  text,
  nivel        text not null check (nivel in ('info','aviso','erro')),
  etapa        text not null,
  mensagem     text not null,
  destino_id   text,
  criado_em    timestamptz not null default now()
);
create index if not exists system_logs_recentes on system_logs(criado_em desc);

-- ---------------------------------------------------------------- métricas (sem dados pessoais)
create table if not exists whatsapp_clicks (
  id             bigserial primary key,
  oferta_codigo  text,
  destino_id     text,
  cidade_origem  text,
  campanha_id    text,
  pagina         text,
  criado_em      timestamptz not null default now()
);
create table if not exists metric_events (
  id             bigserial primary key,
  tipo           text not null check (tipo in ('visualizacao','conhecer')),
  oferta_codigo  text,
  destino_id     text,
  cidade_origem  text,
  campanha_id    text,
  pagina         text,
  criado_em      timestamptz not null default now()
);

-- ---------------------------------------------------------------- RLS
alter table admin_users enable row level security;
alter table destinations enable row level security;
alter table airports enable row level security;
alter table campaigns enable row level security;
alter table destination_campaigns enable row level security;
alter table destination_contents enable row level security;
alter table images enable row level security;
alter table monitoring_rules enable row level security;
alter table pricing_rules enable row level security;
alter table consultants enable row level security;
alter table app_settings enable row level security;
alter table robot_runs enable row level security;
alter table flight_searches enable row level security;
alter table flight_offers enable row level security;
alter table flight_offer_prices enable row level security;
alter table system_logs enable row level security;
alter table whatsapp_clicks enable row level security;
alter table metric_events enable row level security;

-- leitura pública (site)
create policy pub_destinations on destinations for select using (ativo);
create policy pub_airports on airports for select using (ativo);
create policy pub_campaigns on campaigns for select using (ativa);
create policy pub_dest_camp on destination_campaigns for select using (true);
create policy pub_contents on destination_contents for select using (true);
create policy pub_images on images for select using (true);
create policy pub_settings on app_settings for select using (publico);
create policy pub_offers on flight_offers for select using (status = 'publicado');

-- visitante só registra eventos (colunas não guardam dados pessoais)
create policy ins_clicks on whatsapp_clicks for insert to anon, authenticated with check (true);
create policy ins_events on metric_events for insert to anon, authenticated with check (true);

-- equipe: acesso total pelo painel
do $$
declare t text;
begin
  foreach t in array array['admin_users','destinations','airports','campaigns','destination_campaigns','destination_contents','images',
    'monitoring_rules','pricing_rules','consultants','app_settings','robot_runs','flight_searches','flight_offers','flight_offer_prices',
    'system_logs','whatsapp_clicks','metric_events']
  loop
    execute format('create policy adm_all_%s on %I for all to authenticated using (is_admin()) with check (is_admin())', t, t);
  end loop;
end $$;

-- Primeiro administrador (depois de criar o usuário em Authentication > Users):
--   insert into admin_users (user_id, nome, papel) values ('<uuid do usuário>', 'Alexandre', 'admin');

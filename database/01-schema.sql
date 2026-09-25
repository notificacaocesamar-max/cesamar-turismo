-- ==========================================================================
-- Cesamar Turismo — schema PostgreSQL 16
-- Executado automaticamente pelo container na primeira subida (docker-entrypoint-initdb.d)
-- ==========================================================================
SET client_encoding = 'UTF8';

CREATE TABLE IF NOT EXISTS destinos (
  id          serial PRIMARY KEY,
  slug        text NOT NULL UNIQUE,
  nome        text NOT NULL,
  local       text NOT NULL DEFAULT '',
  tipo        text NOT NULL CHECK (tipo IN ('nacional','internacional')),
  regiao      text NOT NULL DEFAULT '',
  temas       text[] NOT NULL DEFAULT '{}',
  meses       int[]  NOT NULL DEFAULT '{}',
  epoca       text NOT NULL DEFAULT '',
  chamada     text NOT NULL DEFAULT '',
  descricao   text NOT NULL DEFAULT '',
  imagem      text NULL,               -- ex.: 'paris.jpg' (vazio = ilustração .svg padrão)
  ordem       int  NOT NULL DEFAULT 0,
  ativo       boolean NOT NULL DEFAULT true,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pacotes (
  id             serial PRIMARY KEY,
  slug           text NOT NULL UNIQUE,
  titulo         text NOT NULL,
  destino_slug   text NOT NULL REFERENCES destinos(slug) ON UPDATE CASCADE,
  tipo           text NOT NULL CHECK (tipo IN ('nacional','internacional')),
  noites         int  NOT NULL CHECK (noites > 0),
  preco_a_partir numeric(12,2) NOT NULL CHECK (preco_a_partir >= 0),
  preco_de       numeric(12,2) NULL,
  badge          text NULL,
  parcelas       int NOT NULL DEFAULT 10,
  tags           text[] NOT NULL DEFAULT '{}',
  resumo         text NOT NULL DEFAULT '',
  inclui         jsonb NOT NULL DEFAULT '[]',
  nao_inclui     jsonb NOT NULL DEFAULT '[]',
  roteiro        jsonb NOT NULL DEFAULT '[]',
  destaque       boolean NOT NULL DEFAULT false,
  saida          text NOT NULL DEFAULT 'Rio de Janeiro (GIG)',
  ordem          int NOT NULL DEFAULT 0,
  ativo          boolean NOT NULL DEFAULT true,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_pacotes_destino ON pacotes(destino_slug);

CREATE TABLE IF NOT EXISTS cruzeiros (
  id             serial PRIMARY KEY,
  slug           text NOT NULL UNIQUE,
  nome           text NOT NULL,
  arte           text NOT NULL,
  noites         int NOT NULL,
  preco_a_partir numeric(12,2) NOT NULL,
  temporada      text NOT NULL DEFAULT '',
  portos         text[] NOT NULL DEFAULT '{}',
  resumo         text NOT NULL DEFAULT '',
  ordem          int NOT NULL DEFAULT 0,
  ativo          boolean NOT NULL DEFAULT true
);

-- Funil de vendas: NOVO → EM_ATENDIMENTO → PROPOSTA_ENVIADA → FECHADO | PERDIDO
CREATE TABLE IF NOT EXISTS leads (
  id             bigserial PRIMARY KEY,
  nome           text NOT NULL,
  email          text NULL,
  whatsapp       text NULL,
  destino        text NULL,
  pacote         text NULL,
  mes            text NULL,
  pessoas        int  NULL,
  criancas       int  NULL,
  orcamento      text NULL,
  mensagem       text NULL,
  origem         text NOT NULL DEFAULT 'site',
  origem_pagina  text NULL,
  status         text NOT NULL DEFAULT 'NOVO'
                 CHECK (status IN ('NOVO','EM_ATENDIMENTO','PROPOSTA_ENVIADA','FECHADO','PERDIDO')),
  responsavel    text NULL,
  observacoes    text NULL,
  ip             text NULL,
  user_agent     text NULL,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atualizado_em  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS ix_leads_criado ON leads(criado_em DESC);

-- Histórico de cada lead (nunca apagar — mesmo padrão de histórico do portal Store Control)
CREATE TABLE IF NOT EXISTS lead_eventos (
  id          bigserial PRIMARY KEY,
  lead_id     bigint NOT NULL REFERENCES leads(id),
  tipo        text NOT NULL,           -- CRIADO | STATUS | NOTA | RESPONSAVEL
  de_status   text NULL,
  para_status text NULL,
  nota        text NULL,
  usuario     text NULL,
  criado_em   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_lead_eventos_lead ON lead_eventos(lead_id, criado_em);

CREATE TABLE IF NOT EXISTS auditoria (
  id          bigserial PRIMARY KEY,
  usuario     text NULL,
  acao        text NOT NULL,
  entidade    text NOT NULL,
  entidade_id text NULL,
  detalhes    jsonb NULL,
  ip          text NULL,
  criado_em   timestamptz NOT NULL DEFAULT now()
);

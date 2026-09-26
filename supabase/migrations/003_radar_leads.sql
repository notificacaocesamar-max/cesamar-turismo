create table if not exists public.radar_leads (
  id                text primary key,
  fonte             text not null,
  url               text not null,
  titulo            text not null,
  preco_encontrado  numeric(12,2),
  preco_texto       text,
  capturado_em      timestamptz not null,
  status            text not null check (status in ('aguardando_confirmacao','confirmado','descartado','erro')),
  uso               text not null default 'radar',
  observacao        text,
  atualizado_em     timestamptz not null default now()
);
create unique index if not exists radar_leads_url on public.radar_leads(url);

alter table public.radar_leads enable row level security;
create policy "admins_radar_leads" on public.radar_leads for all
  using (public.is_admin()) with check (public.is_admin());

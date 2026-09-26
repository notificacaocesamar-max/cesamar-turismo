-- Execute somente se o schema anterior já tiver sido instalado.
alter table public.flight_offers
  add column if not exists taxas_inclusas boolean not null default false,
  add column if not exists expira_em timestamptz;

alter table public.flight_offers
  drop constraint if exists flight_offers_tipo_preco_check;

alter table public.flight_offers
  add constraint flight_offers_tipo_preco_check
  check (tipo_preco in ('ao_vivo','indicativo','manual','demonstrativo','teste_api'));

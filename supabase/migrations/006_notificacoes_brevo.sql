-- Controle idempotente dos avisos enviados pelo Brevo.
alter table public.radares_viagem
  add column if not exists email_status text not null default 'pendente'
    check (email_status in ('pendente','enviando','enviado','erro')),
  add column if not exists email_enviado_em timestamptz,
  add column if not exists email_message_id text,
  add column if not exists email_erro text,
  add column if not exists email_tentativas integer not null default 0;

alter table public.customer_leads
  add column if not exists email_status text not null default 'pendente'
    check (email_status in ('pendente','enviando','enviado','erro')),
  add column if not exists email_enviado_em timestamptz,
  add column if not exists email_message_id text,
  add column if not exists email_erro text,
  add column if not exists email_tentativas integer not null default 0;

create index if not exists radares_email_pendente
  on public.radares_viagem(email_status, criado_em)
  where email_status in ('pendente','erro');

create index if not exists leads_email_pendente
  on public.customer_leads(email_status, criado_em)
  where email_status in ('pendente','erro');

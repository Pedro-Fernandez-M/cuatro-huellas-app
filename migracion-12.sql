-- Cuatro Huellas — Migración 12
-- Suscripciones de Web Push: cada fila es un teléfono/navegador del staff que
-- aceptó recibir notificaciones. Se usa para avisar cuando entra una reserva
-- nueva desde la web.
-- Ejecuta TODO este archivo en el SQL Editor de Supabase.

create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  -- endpoint es la URL única que el navegador nos da; identifica al dispositivo.
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  -- Nombre que el propio staff le pone al dispositivo ("Celular Isabel").
  device_label text,
  user_id     uuid references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  last_sent_at timestamptz
);

create index if not exists push_subscriptions_user_idx on push_subscriptions(user_id);

alter table push_subscriptions enable row level security;

-- Solo el staff autenticado ve y administra sus propias suscripciones.
-- El envío se hace desde el servidor con la service role key, que salta RLS.
drop policy if exists "staff gestiona sus suscripciones" on push_subscriptions;
create policy "staff gestiona sus suscripciones"
  on push_subscriptions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

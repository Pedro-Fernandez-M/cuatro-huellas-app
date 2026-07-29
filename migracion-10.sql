-- Cuatro Huellas — Migración 10
-- Ofertas / promociones editables desde el panel. El admin escribe el mensaje
-- y decide si aparece o no en la web con el interruptor "activa".
-- Ejecuta TODO este archivo en el SQL Editor de Supabase.

-- ── Tabla de ofertas ────────────────────────────────────────
create table if not exists offers (
  id         uuid primary key default gen_random_uuid(),
  message    text not null,
  emoji      text not null default '🎉',
  active     boolean not null default false,
  created_at timestamptz not null default now()
);

-- Un par de ejemplos (nacen desactivados, no se muestran hasta que el admin los active)
insert into offers (message, emoji, active) values
  ('Solo Agosto: solicita tu 5% de descuento 🐾', '🎉', false),
  ('¡Ven a tirar los dados por tu descuento!', '🎲', false)
on conflict do nothing;

-- ── RLS: lectura pública solo de las activas, escritura solo staff ──
alter table offers enable row level security;

create policy "offers_public_read" on offers for select to anon using (active = true);
create policy "offers_staff_all"   on offers for all to authenticated using (true) with check (true);

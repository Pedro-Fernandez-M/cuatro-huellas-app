-- Cuatro Huellas — Migración 5
-- Ingresos manuales (ventas de productos, otros ingresos fuera de una cita).
-- Ejecuta este archivo en el SQL Editor de Supabase.

create table manual_incomes (
  id          uuid primary key default gen_random_uuid(),
  amount      numeric(10, 0) not null check (amount > 0),
  description text,
  income_date date not null default current_date,
  created_at  timestamptz not null default now()
);

alter table manual_incomes enable row level security;

create policy "staff_all_manual_incomes"
  on manual_incomes for all to authenticated using (true) with check (true);

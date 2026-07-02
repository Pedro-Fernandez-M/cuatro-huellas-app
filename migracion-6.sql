-- Cuatro Huellas — Migración 6
-- Contabilidad: gastos/egresos + método de pago en los ingresos.
-- Ejecuta TODO este archivo en el SQL Editor de Supabase.

-- Método de pago en los cobros (efectivo / transferencia / tarjeta / otro)
alter table appointments   add column if not exists payment_method text;
alter table manual_incomes add column if not exists payment_method text;

-- Gastos / egresos del negocio
create table if not exists expenses (
  id             uuid primary key default gen_random_uuid(),
  amount         numeric(10, 0) not null check (amount > 0),
  category       text not null,
  description    text,
  expense_date   date not null default current_date,
  payment_method text,
  created_at     timestamptz not null default now()
);
create index if not exists expenses_date_idx on expenses(expense_date);

alter table expenses enable row level security;

create policy "staff_all_expenses"
  on expenses for all to authenticated using (true) with check (true);

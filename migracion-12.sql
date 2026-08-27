-- Cuatro Huellas — Migración 12
-- Tres funcionarias con roles (admin / asistente) y agenda por persona.
--   • Isabel Peña   → admin (ve todo, incluida monetización e inventario)
--   • Luisa Rivas   → asistente
--   • Soledad Keuter→ asistente
-- Cada funcionaria atiende 1 perro a la vez: la disponibilidad se calcula
-- por persona. Ejecuta TODO este archivo en el SQL Editor de Supabase.

-- ============================================================
-- 1) Tabla de staff / funcionarias
-- ============================================================
create table if not exists staff (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  name       text not null,
  role       text not null default 'assistant' check (role in ('admin', 'assistant')),
  active     boolean not null default true,
  photo_url  text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

insert into staff (email, name, role, sort_order) values
  ('isabel@cuatrohuellas.cl',  'Isabel Peña',    'admin',     1),
  ('luisa@cuatrohuellas.cl',   'Luisa Rivas',    'assistant', 2),
  ('soledad@cuatrohuellas.cl', 'Soledad Keuter', 'assistant', 3)
on conflict (email) do update set name = excluded.name, role = excluded.role, sort_order = excluded.sort_order;

-- ============================================================
-- 2) Cada cita queda asociada a la funcionaria que atiende
-- ============================================================
alter table appointments add column if not exists staff_id uuid references staff(id);
create index if not exists appointments_staff_idx on appointments(staff_id, appointment_date);

-- ============================================================
-- 3) Helpers de rol (leen el email del usuario logueado)
-- ============================================================
create or replace function current_staff_role() returns text
language sql stable security definer as $$
  select role from staff where email = (auth.jwt() ->> 'email') and active = true limit 1;
$$;

create or replace function is_staff_admin() returns boolean
language sql stable security definer as $$
  select coalesce(current_staff_role() = 'admin', false);
$$;

grant execute on function current_staff_role() to authenticated;
grant execute on function is_staff_admin() to authenticated;

-- ============================================================
-- 4) RLS de la tabla staff + lista pública segura (sin email)
-- ============================================================
alter table staff enable row level security;
create policy "staff_read_auth"   on staff for select to authenticated using (true);
create policy "staff_admin_write" on staff for all to authenticated using (is_staff_admin()) with check (is_staff_admin());

-- La web pública necesita ver quién atiende (nombre + foto), pero NO el email.
create or replace function get_active_staff()
returns table(id uuid, name text, photo_url text, sort_order int)
language sql stable security definer as $$
  select id, name, photo_url, sort_order from staff where active = true order by sort_order, name;
$$;
grant execute on function get_active_staff() to anon, authenticated;

-- ============================================================
-- 5) Monetización e inventario: SOLO admin (defensa a nivel BD)
--    Las asistentes igual pueden cobrar (eso vive en appointments,
--    que sigue accesible), pero no ven ingresos/gastos/inventario.
-- ============================================================
drop policy if exists "staff_all_products"       on inventory_products;
drop policy if exists "staff_all_movements"       on inventory_movements;
drop policy if exists "staff_all_manual_incomes"  on manual_incomes;
drop policy if exists "staff_all_expenses"        on expenses;

create policy "admin_all_products"      on inventory_products  for all to authenticated using (is_staff_admin()) with check (is_staff_admin());
create policy "admin_all_movements"     on inventory_movements for all to authenticated using (is_staff_admin()) with check (is_staff_admin());
create policy "admin_all_manual_incomes" on manual_incomes     for all to authenticated using (is_staff_admin()) with check (is_staff_admin());
create policy "admin_all_expenses"      on expenses            for all to authenticated using (is_staff_admin()) with check (is_staff_admin());

-- ============================================================
-- 6) Disponibilidad POR PERSONA
--    p_staff_id no nulo  → esa persona debe estar libre (0 solapes)
--    p_staff_id nulo     → comportamiento antiguo (cupo global de 3)
-- ============================================================
create or replace function get_available_slots(
  p_date date,
  p_size_category size_category_type,
  p_staff_id uuid default null
) returns text[]
language plpgsql
security definer
stable
as $$
declare
  v_dow         int := extract(dow from p_date);
  v_open        time;
  v_close       time;
  v_duration    int;
  v_last_start  time;
  v_morning_end time := time '12:00';
  v_is_big      boolean;
  v_slot        time;
  v_slots       text[] := '{}';
  v_overlap     int;
begin
  if exists (select 1 from blocked_dates where blocked_date = p_date) then
    return '{}';
  end if;

  if v_dow = 0 then
    return '{}';                                       -- domingo cerrado
  elsif v_dow = 6 then
    v_open := time '09:30'; v_close := time '13:00';   -- sábado
  else
    v_open := time '09:30'; v_close := time '15:00';   -- lunes a viernes
  end if;

  v_is_big   := p_size_category in ('grande', 'extra_grande');
  v_duration := case when v_is_big then 360 else 180 end;

  if v_is_big then
    v_last_start := least(v_morning_end, v_close);
  else
    v_last_start := v_close - (v_duration || ' minutes')::interval;
  end if;

  v_slot := v_open;
  while v_slot <= v_last_start loop
    select count(*) into v_overlap
    from appointments
    where appointment_date = p_date
      and status in ('booked', 'arrived')
      and (p_staff_id is null or staff_id = p_staff_id)
      and start_time < (v_slot + (v_duration || ' minutes')::interval)
      and (start_time + (duration_minutes || ' minutes')::interval) > v_slot;

    if (p_staff_id is null and v_overlap < 3)
       or (p_staff_id is not null and v_overlap = 0) then
      v_slots := array_append(v_slots, to_char(v_slot, 'HH24:MI'));
    end if;

    v_slot := v_slot + interval '30 minutes';
  end loop;

  return v_slots;
end;
$$;

grant execute on function get_available_slots(date, size_category_type, uuid) to anon, authenticated;

-- ============================================================
-- 7) book_appointment con p_staff_id
--    Sin forzar y con staff → la persona debe estar libre (0 solapes).
-- ============================================================
create or replace function book_appointment(
  p_owner_name      text,
  p_owner_phone     text,
  p_pet_name        text,
  p_pet_breed       text,
  p_size_category   size_category_type,
  p_service         text,
  p_addons          text[],
  p_coat_condition  text,
  p_appointment_date date,
  p_start_time      time,
  p_duration_minutes int,
  p_source          appointment_source default 'online',
  p_status          appointment_status default 'booked',
  p_arrival_time    timestamptz default null,
  p_force           boolean default false,
  p_staff_id        uuid default null
) returns appointments
language plpgsql
security definer
as $$
declare
  v_client_id uuid;
  v_pet_id    uuid;
  v_overlap   int;
  v_row       appointments;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_appointment_date::text, 0));

  if not p_force then
    select count(*) into v_overlap
    from appointments
    where appointment_date = p_appointment_date
      and status in ('booked', 'arrived')
      and (p_staff_id is null or staff_id = p_staff_id)
      and start_time < (p_start_time + (p_duration_minutes || ' minutes')::interval)
      and (start_time + (duration_minutes || ' minutes')::interval) > p_start_time;

    -- con persona elegida: basta 1 solape para estar ocupada; sin persona: tope 3
    if (p_staff_id is not null and v_overlap >= 1)
       or (p_staff_id is null and v_overlap >= 3) then
      raise exception 'CAPACITY_FULL';
    end if;
  end if;

  insert into clients (owner_name, owner_phone)
  values (p_owner_name, p_owner_phone)
  on conflict (owner_phone) do update set owner_name = excluded.owner_name
  returning id into v_client_id;

  select id into v_pet_id from pets
  where client_id = v_client_id and name = p_pet_name
  limit 1;

  if v_pet_id is null then
    insert into pets (client_id, name, breed, size_category)
    values (v_client_id, p_pet_name, p_pet_breed, p_size_category)
    returning id into v_pet_id;
  else
    update pets set breed = p_pet_breed, size_category = p_size_category where id = v_pet_id;
  end if;

  insert into appointments (
    client_id, pet_id, owner_name, owner_phone, pet_name, pet_breed, size_category,
    service, addons, coat_condition, appointment_date, start_time, duration_minutes,
    status, source, arrival_time, staff_id
  ) values (
    v_client_id, v_pet_id, p_owner_name, p_owner_phone, p_pet_name, p_pet_breed, p_size_category,
    p_service, coalesce(p_addons, '{}'), p_coat_condition,
    p_appointment_date, p_start_time, p_duration_minutes,
    p_status, p_source, p_arrival_time, p_staff_id
  )
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function book_appointment(
  text, text, text, text, size_category_type, text, text[], text,
  date, time, int, appointment_source, appointment_status, timestamptz, boolean, uuid
) to anon, authenticated;

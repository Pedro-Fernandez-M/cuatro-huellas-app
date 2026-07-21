-- Cuatro Huellas — esquema completo de base de datos
-- Copia y pega TODO este archivo en el SQL Editor de Supabase y ejecútalo de una vez.

-- ============================================================
-- Paso 1: Extensiones y tipos
-- ============================================================

create extension if not exists pgcrypto;

create type appointment_status as enum ('booked', 'arrived', 'completed', 'cancelled', 'no_show');
create type appointment_source as enum ('online', 'walk_in', 'manual');
create type service_type        as enum ('bano_mantencion', 'servicio_completo', 'bano_comercial', 'deslanado');
create type size_category_type  as enum ('pequena', 'mediana', 'grande', 'extra_grande');
-- La categoría de inventario es texto libre (el staff crea las que necesite).

-- ============================================================
-- Paso 2: Tablas
-- ============================================================

-- Dueños de mascotas
create table clients (
  id          uuid primary key default gen_random_uuid(),
  owner_name  text not null,
  owner_phone text not null unique,
  created_at  timestamptz not null default now()
);

-- Mascotas
create table pets (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references clients(id) on delete cascade,
  name          text not null,
  breed         text not null,
  size_category size_category_type not null,
  temperament   text,   -- carácter: nervioso, muerde, tranquilo...
  allergies     text,   -- alergias / piel sensible
  notes         text,   -- observaciones: corte preferido, etc.
  created_at    timestamptz not null default now()
);
create index pets_client_id_idx on pets(client_id);

-- Reservas / visitas (una sola tabla cubre todo el ciclo de vida)
create table appointments (
  id uuid primary key default gen_random_uuid(),

  client_id uuid references clients(id) on delete set null,
  pet_id    uuid references pets(id) on delete set null,

  owner_name    text not null,
  owner_phone   text not null,
  pet_name      text not null,
  pet_breed     text not null,
  size_category size_category_type not null,

  service        text not null,
  addons         text[] not null default '{}',
  coat_condition text,

  appointment_date date not null,
  start_time        time not null,
  duration_minutes  int not null,

  status appointment_status not null default 'booked',
  source appointment_source not null default 'online',

  arrival_time   timestamptz,
  departure_time timestamptz,
  price_charged  numeric(10, 0),
  payment_method text,

  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index appointments_date_idx on appointments(appointment_date, status);

-- Días bloqueados (feriados, etc. — bloqueo de día completo)
create table blocked_dates (
  id           uuid primary key default gen_random_uuid(),
  blocked_date date not null unique,
  reason       text,
  created_at   timestamptz not null default now()
);

-- Inventario
create table inventory_products (
  id            uuid primary key default gen_random_uuid(),
  category      text not null,
  variant       text,
  display_name  text not null,
  current_stock int not null default 0,        -- para líquidos se cuenta en DOSIS
  unit          text not null default 'unidad',
  container_ml        int,                     -- ml que trae el envase (ej. bidón 5000 ml)
  doses_per_container int,                     -- cuántas dosis rinde un envase
  created_at    timestamptz not null default now(),
  unique (category, variant)
);

-- Ingresos manuales (ventas de productos, otros ingresos fuera de una cita)
create table manual_incomes (
  id          uuid primary key default gen_random_uuid(),
  amount      numeric(10, 0) not null check (amount > 0),
  description text,
  income_date date not null default current_date,
  payment_method text,
  created_at  timestamptz not null default now()
);

-- Gastos / egresos del negocio
create table expenses (
  id             uuid primary key default gen_random_uuid(),
  amount         numeric(10, 0) not null check (amount > 0),
  category       text not null,
  description    text,
  expense_date   date not null default current_date,
  payment_method text,
  created_at     timestamptz not null default now()
);
create index expenses_date_idx on expenses(expense_date);

-- Servicios (editables desde el panel)
create table services (
  id          text primary key,
  name        text not null,
  description text,
  includes    text[] not null default '{}',
  active      boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- Precios (clave → monto)
create table pricing (
  key        text primary key,
  amount     numeric(10, 0) not null default 0,
  updated_at timestamptz not null default now()
);

create table inventory_movements (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references inventory_products(id) on delete cascade,
  movement_type text not null check (movement_type in ('in', 'out')),
  quantity     int not null check (quantity > 0),
  note         text,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now()
);
create index inventory_movements_product_idx on inventory_movements(product_id, created_at desc);

-- ============================================================
-- Paso 3: Row Level Security
-- ============================================================

alter table clients             enable row level security;
alter table pets                enable row level security;
alter table appointments        enable row level security;
alter table blocked_dates       enable row level security;
alter table inventory_products  enable row level security;
alter table inventory_movements enable row level security;
alter table manual_incomes      enable row level security;
alter table expenses            enable row level security;
alter table services            enable row level security;
alter table pricing             enable row level security;

create policy "staff_all_clients"      on clients             for all to authenticated using (true) with check (true);
create policy "staff_all_pets"         on pets                for all to authenticated using (true) with check (true);
create policy "staff_all_appointments" on appointments        for all to authenticated using (true) with check (true);
create policy "staff_all_blocked"      on blocked_dates       for all to authenticated using (true) with check (true);
create policy "staff_all_products"     on inventory_products  for all to authenticated using (true) with check (true);
create policy "staff_all_movements"    on inventory_movements for all to authenticated using (true) with check (true);
create policy "staff_all_manual_incomes" on manual_incomes    for all to authenticated using (true) with check (true);
create policy "staff_all_expenses"     on expenses            for all to authenticated using (true) with check (true);
create policy "services_public_read"   on services for select to anon using (active = true);
create policy "services_staff_all"     on services for all to authenticated using (true) with check (true);
create policy "pricing_public_read"    on pricing  for select to anon using (true);
create policy "pricing_staff_all"      on pricing  for all to authenticated using (true) with check (true);

-- ============================================================
-- Paso 4: Funciones
-- ============================================================

-- book_appointment: crea una reserva validando el cupo de 3 perros simultáneos
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
  p_arrival_time    timestamptz default null
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

  select count(*) into v_overlap
  from appointments
  where appointment_date = p_appointment_date
    and status in ('booked', 'arrived')
    and start_time < (p_start_time + (p_duration_minutes || ' minutes')::interval)
    and (start_time + (duration_minutes || ' minutes')::interval) > p_start_time;

  if v_overlap >= 3 then
    raise exception 'CAPACITY_FULL';
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
    status, source, arrival_time
  ) values (
    v_client_id, v_pet_id, p_owner_name, p_owner_phone, p_pet_name, p_pet_breed, p_size_category,
    p_service, coalesce(p_addons, '{}'), p_coat_condition,
    p_appointment_date, p_start_time, p_duration_minutes,
    p_status, p_source, p_arrival_time
  )
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function book_appointment(
  text, text, text, text, size_category_type, text, text[], text,
  date, time, int, appointment_source, appointment_status, timestamptz
) to anon, authenticated;

-- reschedule_appointment: cambia fecha/hora revalidando el cupo
create or replace function reschedule_appointment(
  p_appointment_id uuid,
  p_new_date date,
  p_new_time time
) returns appointments
language plpgsql
security definer
as $$
declare
  v_duration int;
  v_overlap  int;
  v_row      appointments;
begin
  select duration_minutes into v_duration from appointments where id = p_appointment_id;
  if v_duration is null then
    raise exception 'APPOINTMENT_NOT_FOUND';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_new_date::text, 0));

  select count(*) into v_overlap
  from appointments
  where appointment_date = p_new_date
    and status in ('booked', 'arrived')
    and id <> p_appointment_id
    and start_time < (p_new_time + (v_duration || ' minutes')::interval)
    and (start_time + (duration_minutes || ' minutes')::interval) > p_new_time;

  if v_overlap >= 3 then
    raise exception 'CAPACITY_FULL';
  end if;

  update appointments
    set appointment_date = p_new_date, start_time = p_new_time, updated_at = now()
    where id = p_appointment_id
    returning * into v_row;

  return v_row;
end;
$$;

grant execute on function reschedule_appointment(uuid, date, time) to authenticated;

-- get_available_slots: horarios disponibles para una fecha + tamaño
create or replace function get_available_slots(
  p_date date,
  p_size_category size_category_type
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
  v_morning_end time := time '12:00';   -- fin de la "mañana" para perros grandes
  v_is_big      boolean;
  v_slot        time;
  v_slots       text[] := '{}';
  v_overlap     int;
begin
  if exists (select 1 from blocked_dates where blocked_date = p_date) then
    return '{}';
  end if;

  if v_dow = 0 then
    return '{}';
  elsif v_dow = 6 then
    v_open := time '09:30'; v_close := time '13:00';
  else
    v_open := time '09:30'; v_close := time '15:00';
  end if;

  v_is_big   := p_size_category in ('grande', 'extra_grande');
  v_duration := case when v_is_big then 360 else 180 end;

  -- grandes/extra grandes: cualquier hora de la mañana (retiro puede ser tras el cierre)
  -- pequeños/medianos: que el servicio termine antes del cierre
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
      and start_time < (v_slot + (v_duration || ' minutes')::interval)
      and (start_time + (duration_minutes || ' minutes')::interval) > v_slot;

    if v_overlap < 3 then
      v_slots := array_append(v_slots, to_char(v_slot, 'HH24:MI'));
    end if;

    v_slot := v_slot + interval '30 minutes';
  end loop;

  return v_slots;
end;
$$;

grant execute on function get_available_slots(date, size_category_type) to anon, authenticated;

-- record_inventory_movement: mueve stock (entrada/salida) de forma atómica
create or replace function record_inventory_movement(
  p_product_id uuid,
  p_type       text,
  p_quantity   int,
  p_note       text
) returns void
language plpgsql
security definer
as $$
begin
  if p_type = 'out' then
    update inventory_products
      set current_stock = current_stock - p_quantity
      where id = p_product_id and current_stock >= p_quantity;
    if not found then
      raise exception 'STOCK_INSUFICIENTE';
    end if;
  elsif p_type = 'in' then
    update inventory_products set current_stock = current_stock + p_quantity where id = p_product_id;
  else
    raise exception 'TIPO_INVALIDO';
  end if;

  insert into inventory_movements (product_id, movement_type, quantity, note, created_by)
  values (p_product_id, p_type, p_quantity, p_note, auth.uid());
end;
$$;

grant execute on function record_inventory_movement(uuid, text, int, text) to authenticated;

-- ============================================================
-- Paso 5: Datos semilla del inventario
-- ============================================================

insert into inventory_products (category, variant, display_name, current_stock) values
  ('Shampoo', 'Avena',          'Shampoo Avena',          0),
  ('Shampoo', 'Hipoalergénico', 'Shampoo Hipoalergénico', 0),
  ('Shampoo', 'Neutro',         'Shampoo Neutro',         0),
  ('Shampoo', 'Pita Uva',       'Shampoo Pita Uva',       0),
  ('Shampoo', 'Pelo Blanco',    'Shampoo Pelo Blanco',    0),
  ('Shampoo', 'Pelo Negro',     'Shampoo Pelo Negro',     0),
  ('Shampoo', 'Matico',         'Shampoo Matico',         0),
  ('Shampoo', 'Keratina',       'Shampoo Keratina',       0),
  ('Polvo de oído', null, 'Polvo de oído', 0),
  ('Alcohol',       null, 'Alcohol',       0),
  ('Polvo de uñas', null, 'Polvo de uñas', 0),
  ('Colonias',      null, 'Colonias',      0);

-- Servicios iniciales
insert into services (id, name, description, includes, sort_order) values
  ('bano_mantencion', 'Baño con mantención',
   'Mantiene la higiene y el pelaje en óptimo estado: se retoca la carita, se cepilla el pelaje completo, redondeo de patas y despeje sanitario.',
   array['Retoque de carita','Cepillado completo','Redondeo de patas','Despeje sanitario'], 1),
  ('servicio_completo', 'Servicio Completo Peluquería',
   'Corte y modelado completo según la raza o tu preferencia.',
   array['Baño desmugrante','Corte de pelo según raza o preferencia','Cepillado','Corte de uñas','Limpieza de oídos','Despeje de cojinetes'], 2),
  ('bano_comercial', 'Baño Comercial', 'Baño estándar rápido y prolijo para tu mascota.', array[]::text[], 3),
  ('deslanado', 'Deslanado (mantos de doble capa)',
   'Retira el pelo muerto de la capa interna (subpelo) sin cortar el manto externo. Ideal para razas de doble capa.',
   array['Baño desmugrante','Baño cosmético','Deslanado','Corte de uñas','Limpieza de oídos','Despeje de cojinetes','Despeje sanitario'], 4);

-- Precios iniciales
insert into pricing (key, amount) values
  ('size_pequena', 21000), ('size_mediana', 24000), ('size_grande', 35000), ('size_extra_grande', 70000),
  ('addon_lavado_dientes', 4000), ('addon_pintado_unas', 3000), ('addon_retiro_feca', 5000),
  ('addon_masticable_pulgas', 6500), ('coat_mal_estado', 7000);

-- Paso 6 (usuario admin) se hace desde el Dashboard, no por SQL — ver SETUP.md.

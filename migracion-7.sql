-- Cuatro Huellas — Migración 7
-- Servicios y precios editables desde el panel (antes estaban fijos en el código).
-- Ejecuta TODO este archivo en el SQL Editor de Supabase.

-- ── Tabla de servicios ──────────────────────────────────────
create table if not exists services (
  id          text primary key,          -- slug: bano_mantencion, etc. o personalizado
  name        text not null,
  description text,
  includes    text[] not null default '{}',
  active      boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

insert into services (id, name, description, includes, sort_order) values
  ('bano_mantencion', 'Baño con mantención',
   'Mantiene la higiene y el pelaje en óptimo estado: se retoca la carita, se cepilla el pelaje completo, redondeo de patas y despeje sanitario.',
   array['Retoque de carita','Cepillado completo','Redondeo de patas','Despeje sanitario'], 1),
  ('servicio_completo', 'Servicio Completo Peluquería',
   'Corte y modelado completo según la raza o tu preferencia.',
   array['Baño desmugrante','Corte de pelo según raza o preferencia','Cepillado','Corte de uñas','Limpieza de oídos','Despeje de cojinetes'], 2),
  ('bano_comercial', 'Baño Comercial',
   'Baño estándar rápido y prolijo para tu mascota.',
   array[]::text[], 3),
  ('deslanado', 'Deslanado (mantos de doble capa)',
   'Retira el pelo muerto de la capa interna (subpelo) sin cortar el manto externo. Ideal para razas de doble capa.',
   array['Baño desmugrante','Baño cosmético','Deslanado','Corte de uñas','Limpieza de oídos','Despeje de cojinetes','Despeje sanitario'], 4)
on conflict (id) do nothing;

-- ── Tabla de precios (clave → monto) ────────────────────────
create table if not exists pricing (
  key        text primary key,
  amount     numeric(10, 0) not null default 0,
  updated_at timestamptz not null default now()
);

insert into pricing (key, amount) values
  ('size_pequena', 21000),
  ('size_mediana', 24000),
  ('size_grande', 35000),
  ('size_extra_grande', 70000),
  ('addon_lavado_dientes', 4000),
  ('addon_pintado_unas', 3000),
  ('addon_retiro_feca', 5000),
  ('addon_masticable_pulgas', 6500),
  ('coat_mal_estado', 7000)
on conflict (key) do nothing;

-- ── RLS: lectura pública, escritura solo staff ──────────────
alter table services enable row level security;
alter table pricing  enable row level security;

create policy "services_public_read" on services for select to anon using (active = true);
create policy "services_staff_all"   on services for all to authenticated using (true) with check (true);

create policy "pricing_public_read"  on pricing for select to anon using (true);
create policy "pricing_staff_all"    on pricing for all to authenticated using (true) with check (true);

-- ── appointments.service pasa de enum a texto (para permitir servicios nuevos) ──
alter table appointments alter column service type text using service::text;

-- Recrear book_appointment con p_service como texto (antes era el enum service_type)
drop function if exists book_appointment(
  text, text, text, text, size_category_type, service_type, text[], text,
  date, time, int, appointment_source, appointment_status, timestamptz
);

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

-- Cuatro Huellas — Migración 8
-- 1) Apertura 9:30 de lunes a sábado
-- 2) Orden de servicios: Peluquería, Baño mantención, Baño comercial, Deslanado
-- 3) El admin puede agendar sin restricción de cupo ni horario (p_force)
-- 4) Inventario por dosis (ml por bidón y dosis por bidón)
-- Ejecuta TODO este archivo en el SQL Editor de Supabase.

-- ── 2) Orden de los servicios ───────────────────────────────
update services set sort_order = 1 where id = 'servicio_completo';
update services set sort_order = 2 where id = 'bano_mantencion';
update services set sort_order = 3 where id = 'bano_comercial';
update services set sort_order = 4 where id = 'deslanado';

-- ── 4) Inventario: dosis por envase ─────────────────────────
alter table inventory_products add column if not exists container_ml       int;
alter table inventory_products add column if not exists doses_per_container int;

-- ── 1) Horario: apertura 9:30 lunes a sábado ────────────────
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

-- ── 3) book_appointment con p_force (admin sin restricción) ──
drop function if exists book_appointment(
  text, text, text, text, size_category_type, text, text[], text,
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
  p_arrival_time    timestamptz default null,
  p_force           boolean default false
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

  -- El staff puede forzar (p_force) para agregar un 4°, 5° perro, etc.
  if not p_force then
    select count(*) into v_overlap
    from appointments
    where appointment_date = p_appointment_date
      and status in ('booked', 'arrived')
      and start_time < (p_start_time + (p_duration_minutes || ' minutes')::interval)
      and (start_time + (duration_minutes || ' minutes')::interval) > p_start_time;

    if v_overlap >= 3 then
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
  date, time, int, appointment_source, appointment_status, timestamptz, boolean
) to anon, authenticated;

-- ── reschedule con p_force ──────────────────────────────────
drop function if exists reschedule_appointment(uuid, date, time);

create or replace function reschedule_appointment(
  p_appointment_id uuid,
  p_new_date date,
  p_new_time time,
  p_force boolean default false
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

  if not p_force then
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
  end if;

  update appointments
    set appointment_date = p_new_date, start_time = p_new_time, updated_at = now()
    where id = p_appointment_id
    returning * into v_row;

  return v_row;
end;
$$;

grant execute on function reschedule_appointment(uuid, date, time, boolean) to authenticated;

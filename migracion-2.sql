-- Cuatro Huellas — Migración 2
-- Cambios: (1) grandes/extra grandes disponibles toda la mañana,
--          (2) inventario con categorías libres, (3) ortografía "Shampoo".
-- Ejecuta TODO este archivo en el SQL Editor de Supabase.

-- ============================================================
-- 1) Disponibilidad: grandes/extra grandes → toda la mañana
--    (hasta las 12:00). El retiro puede ser después del cierre.
-- ============================================================

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
    return '{}';                                  -- domingo cerrado
  elsif v_dow = 6 then
    v_open := time '09:30'; v_close := time '13:00';   -- sábado
  else
    v_open := time '09:00'; v_close := time '15:00';   -- lunes a viernes
  end if;

  v_is_big   := p_size_category in ('grande', 'extra_grande');
  v_duration := case when v_is_big then 360 else 180 end;

  -- Último horario de inicio permitido:
  --   grandes/extra grandes: cualquier hora de la mañana (hasta 12:00)
  --   pequeños/medianos: que el servicio termine antes del cierre
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

-- ============================================================
-- 2) Inventario: categorías libres (antes eran un enum fijo)
-- ============================================================

alter table inventory_products alter column category type text using category::text;

-- Renombrar las categorías semilla a texto legible
update inventory_products set category = 'Shampoo'       where category = 'champu';
update inventory_products set category = 'Polvo de oído' where category = 'polvo_oido';
update inventory_products set category = 'Alcohol'       where category = 'alcohol';
update inventory_products set category = 'Polvo de uñas' where category = 'polvo_unas';
update inventory_products set category = 'Colonias'      where category = 'colonias';

-- ============================================================
-- 3) Ortografía: "Champú" → "Shampoo"
-- ============================================================

update inventory_products set display_name = replace(display_name, 'Champú', 'Shampoo');

-- Eliminar el tipo enum que ya no se usa
drop type if exists inventory_category;

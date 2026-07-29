-- Cuatro Huellas — Migración 11
-- Fecha de vencimiento opcional para las ofertas: al pasar esa fecha, la oferta
-- deja de aparecer sola en la web (aunque siga "activa"). Vacío = no vence.
-- Ejecuta TODO este archivo en el SQL Editor de Supabase.

alter table offers add column if not exists expires_at date;

-- Recreamos la política de lectura pública para que también excluya las vencidas.
-- Se compara con la fecha de HOY en la zona horaria del local (Chile).
drop policy if exists "offers_public_read" on offers;

create policy "offers_public_read" on offers for select to anon
  using (
    active = true
    and (expires_at is null or expires_at >= (now() at time zone 'America/Santiago')::date)
  );

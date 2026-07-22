-- Cuatro Huellas — Migración 9
-- Recargos por estado del pelaje: Mucho nudo y Apelmazado también suman $7.000.
-- "Solamente sucio" queda en $0 (incluido en el servicio).
-- Ejecuta este archivo en el SQL Editor de Supabase.

insert into pricing (key, amount) values
  ('coat_mucho_nudo', 7000),
  ('coat_apelmazado', 7000)
on conflict (key) do nothing;

-- Por si el de mal estado fue editado, aseguramos el valor pedido:
update pricing set amount = 7000 where key = 'coat_mal_estado';

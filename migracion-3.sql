-- Cuatro Huellas — Migración 3
-- Ficha de mascota: notas de carácter, alergias y observaciones (corte preferido, etc.)
-- Ejecuta TODO este archivo en el SQL Editor de Supabase.

alter table pets add column if not exists temperament text;  -- carácter: nervioso, muerde, tranquilo...
alter table pets add column if not exists allergies   text;  -- alergias / piel sensible
alter table pets add column if not exists notes       text;  -- observaciones: corte preferido, etc.

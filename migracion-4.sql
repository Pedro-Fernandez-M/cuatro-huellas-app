-- Cuatro Huellas — Migración 4
-- Agrega el nuevo servicio "Deslanado (mantos de doble capa)".
-- Ejecuta este archivo en el SQL Editor de Supabase.

alter type service_type add value if not exists 'deslanado';

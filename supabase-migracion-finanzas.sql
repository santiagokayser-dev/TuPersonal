-- Migración: columnas y tabla que faltan para la sección Finanzas
-- Correr en Supabase → SQL Editor → New query → pegar todo → Run
-- Es aditivo: no borra ni modifica datos existentes. Se puede correr
-- de nuevo sin problema (todo usa IF NOT EXISTS / DROP+CREATE de policies).

-- 1) Columna de meses de deuda en clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS meses_deuda integer DEFAULT 0;

-- 2) Columna de día de vencimiento (1-31) en clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS dia_vencimiento integer;

-- 3) Tabla de historial de pagos
CREATE TABLE IF NOT EXISTS pagos_historial (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id uuid REFERENCES auth.users(id) NOT NULL,
  cliente_id uuid REFERENCES clientes(id),
  cliente_nombre text,
  monto numeric,
  meses integer,
  fecha timestamptz DEFAULT now()
);

ALTER TABLE pagos_historial ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trainer_ve_su_historial" ON pagos_historial;
CREATE POLICY "trainer_ve_su_historial" ON pagos_historial
  FOR SELECT USING (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "trainer_inserta_su_historial" ON pagos_historial;
CREATE POLICY "trainer_inserta_su_historial" ON pagos_historial
  FOR INSERT WITH CHECK (auth.uid() = trainer_id);

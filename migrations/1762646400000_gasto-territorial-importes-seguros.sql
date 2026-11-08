-- Up Migration
-- Demonstration contract: non-negative integer COP cents must fit safely in JSON Numbers.
ALTER TABLE gasto_territorial
  ADD CONSTRAINT gasto_territorial_presupuesto_centavos_seguro CHECK (presupuesto_asignado <= 90071992547409.91),
  ADD CONSTRAINT gasto_territorial_gasto_centavos_seguro CHECK (gasto_actual <= 90071992547409.91);

-- Down Migration
ALTER TABLE gasto_territorial
  DROP CONSTRAINT gasto_territorial_presupuesto_centavos_seguro,
  DROP CONSTRAINT gasto_territorial_gasto_centavos_seguro;

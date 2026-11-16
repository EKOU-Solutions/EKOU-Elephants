-- Up Migration
CREATE TABLE gasto_territorial (
  codigo               TEXT PRIMARY KEY CHECK (codigo ~ '^([0-9]{2}|[0-9]{5})$'),
  nombre               TEXT NOT NULL,
  presupuesto_asignado NUMERIC(20, 2) NOT NULL CHECK (presupuesto_asignado >= 0),
  gasto_actual         NUMERIC(20, 2) NOT NULL CHECK (gasto_actual >= 0),
  total_obras          INTEGER NOT NULL CHECK (total_obras >= 0),
  obras_con_retraso    INTEGER NOT NULL CHECK (obras_con_retraso >= 0 AND obras_con_retraso <= total_obras)
);

-- Down Migration
DROP TABLE gasto_territorial;

-- Periodo con el que se lee cada entidad y año: el último que reportó gastos. Los valores son
-- acumulados del año, así que el último periodo ya contiene a los anteriores. Es también el
-- periodo con el que se lee el recaudo, para que recibido y gastado hablen de la misma fecha.
select
    codigo_entidad,
    year(periodo) as anio,
    max(periodo) as periodo
from {{ ref('stg_cuipo_gastos') }}
group by all

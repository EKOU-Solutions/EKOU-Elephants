-- CUIPO, ejecución de ingresos: recaudo total acumulado del año por entidad y periodo
-- (cuenta 1, que ya incluye todos sus hijos).
select
    codigo_entidad,
    ambito_codigo,
    try_strptime(periodo, '%Y%m%d')::date as periodo,
    sum(try_cast(total_recaudo as decimal(24, 2))) as recaudo
from {{ bronze('cuipo_ingresos') }}
where cuenta = '1'
group by all

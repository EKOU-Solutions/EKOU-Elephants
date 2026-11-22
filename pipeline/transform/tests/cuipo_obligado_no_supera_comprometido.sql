-- No se puede recibir un bien o servicio sin haberlo comprometido antes.
select nivel, cod_dpto, cod_mpio, anio, vigencia, rubro, comprometido, obligado
from {{ ref('resumen_gasto_cuipo') }}
where obligado > comprometido

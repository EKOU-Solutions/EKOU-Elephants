{{ config(severity='warn') }}
-- Advertencia, no error: el origen trae casos donde lo pagado supera lo recibido (anticipos,
-- pagos de reservas). La interfaz lo muestra tal cual, sin recortar.
select nivel, cod_dpto, cod_mpio, anio, vigencia, rubro, obligado, pagado
from {{ ref('resumen_gasto_cuipo') }}
where pagado > obligado

-- SECOP II Ubicaciones de ejecución: una fila por (contrato, ubicación).
-- El campo llega como "COLOMBIA»Departamento»Municipio".
with partes as (
    select distinct
        id_contrato,
        string_split(ubicacion, '»') as partes
    from {{ bronze('secop_ubicaciones') }}
    where id_contrato is not null
)

select
    id_contrato,
    {{ normalizar('partes[2]') }} as dpto_norm,
    {{ normalizar('partes[3]') }} as mpio_norm
from partes

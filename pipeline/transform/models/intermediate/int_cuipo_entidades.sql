-- A qué territorio pertenece cada entidad de CUIPO (solo administración central).
--   A439 municipios      últimos 5 dígitos del código CHIP = código DANE; excepciones en el seed
--   A440 Bogotá          municipio 11001 y departamento 11
--   A438 departamentos   los dos primeros de los últimos 5 dígitos son el departamento
--   A441 San Andrés      departamento 88 y, como un solo territorio, municipio 88001
-- Una entidad puede dar dos filas (Bogotá y San Andrés cuentan como municipio y departamento).
-- Los descentralizados (A442) no se extraen: sus códigos no llevan el municipio.
with entidades as (
    select distinct codigo_entidad, ambito_codigo from {{ ref('stg_cuipo_gastos') }}
    union
    select distinct codigo_entidad, ambito_codigo from {{ ref('stg_cuipo_ingresos') }}
),

con_codigo as (
    select
        e.codigo_entidad,
        e.ambito_codigo,
        coalesce(m.cod_mpio, right(e.codigo_entidad, 5)) as cod_mpio_chip,
        right(e.codigo_entidad, 5) as ultimos5
    from entidades as e
    left join {{ ref('cuipo_entidades_manual') }} as m on m.codigo_entidad = e.codigo_entidad
)

select
    codigo_entidad, ambito_codigo, 'municipio' as nivel,
    left(cod_mpio_chip, 2) as cod_dpto, cod_mpio_chip as cod_mpio, 'municipio' as alcance
from con_codigo
where ambito_codigo = 'A439'

union all
select codigo_entidad, ambito_codigo, 'municipio', '11', '11001', 'municipio'
from con_codigo
where ambito_codigo = 'A440'

union all
select codigo_entidad, ambito_codigo, 'departamento', '11', null, 'municipio'
from con_codigo
where ambito_codigo = 'A440'

union all
select codigo_entidad, ambito_codigo, 'departamento', left(ultimos5, 2), null, 'departamento'
from con_codigo
where ambito_codigo = 'A438'

union all
select codigo_entidad, ambito_codigo, 'municipio', '88', '88001', 'departamento-isla'
from con_codigo
where ambito_codigo = 'A441'

union all
select codigo_entidad, ambito_codigo, 'departamento', '88', null, 'departamento-isla'
from con_codigo
where ambito_codigo = 'A441'

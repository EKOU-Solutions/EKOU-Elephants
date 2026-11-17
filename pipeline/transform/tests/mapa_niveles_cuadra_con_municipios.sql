-- Los contratos del nivel municipio, por departamento, son la suma de sus municipios en el mapa.
with niveles as (
    select cod_dpto, contratos from {{ ref('mapa_niveles_corte') }} where nivel = 'municipio'
),

municipios as (
    select left(cod_mpio, 2) as cod_dpto, sum(contratos_ubicados) as contratos
    from {{ ref('mapa_municipios_corte') }}
    group by 1
)

select coalesce(n.cod_dpto, m.cod_dpto) as cod_dpto, n.contratos, m.contratos
from niveles as n
full join municipios as m on m.cod_dpto = n.cod_dpto
where n.contratos is distinct from m.contratos

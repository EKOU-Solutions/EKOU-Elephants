-- Gold: una fila por municipio de DIVIPOLA para el mapa (TASK-09).
-- Contrato de la API: docs/design/pages/map/contract.md.
-- contratos_ubicados: contratos de mapa_municipios firmados en la ventana (los últimos
-- anios_ventana años completos más el año del corte). Null si no hay ninguno: la interfaz
-- muestra "Sin datos", nunca 0.
{% set anio_corte = "year(" ~ fecha_corte() ~ ")" %}

with ventana as (
    select cod_mpio, sum(contratos) as contratos
    from {{ ref('mapa_municipios') }}
    where anio_firma between {{ anio_corte }} - {{ var('anios_ventana', 5) }} and {{ anio_corte }}
    group by cod_mpio
)

select
    d.cod_mpio,
    d.nom_mpio,
    case d.tipo_municipio
        when 'Municipio' then 'municipio'
        when 'Área no municipalizada' then 'area_no_municipalizada'
        when 'Isla' then 'isla'
    end as tipo,
    d.cod_dpto,
    i.iso_3166_2,
    d.nom_dpto,
    {{ anio_corte }} - {{ var('anios_ventana', 5) }} as ventana_desde,
    {{ anio_corte }} as ventana_hasta,
    v.contratos as contratos_ubicados,
    '{{ var("corte") }}' as corte
from {{ ref('stg_divipola') }} as d
left join {{ ref('departamentos_iso') }} as i on i.cod_dpto = d.cod_dpto
left join ventana as v on v.cod_mpio = d.cod_mpio
order by d.cod_mpio

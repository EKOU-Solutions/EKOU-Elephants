-- Gold: contratos del corte por nivel territorial, para el mapa de dos niveles (TASK-09).
-- Cada contrato de la ventana cae en un solo nivel, con los filtros de mapa_municipios:
--   municipio     ubicación municipal de confianza alta, media alta o media (regla S08)
--   departamento  sin municipio confiable, pero con departamento (gobernaciones, varios
--                 municipios, entidades que repiten su sede)
--   sin_lugar     sin municipio ni departamento
-- Contrato de la API: docs/design/pages/map/contract.md.
{% set anio_corte = "year(" ~ fecha_corte() ~ ")" %}

with ventana as (
    select
        case
            when cod_mpio_ejecucion is not null
                and confianza_ubicacion in ('alta', 'media_alta', 'media') then 'municipio'
            when cod_dpto_ejecucion is not null then 'departamento'
            else 'sin_lugar'
        end as nivel,
        cod_mpio_ejecucion,
        cod_dpto_ejecucion
    from {{ ref('contratos') }}
    where estado_ejecucion not in ('antes_de_firma', 'cancelado')
        and fecha_firma <= last_day({{ fecha_corte() }})
        and anio_firma between {{ anio_corte }} - {{ var('anios_ventana', 5) }} and {{ anio_corte }}
)

select
    nivel,
    case
        when nivel = 'municipio' then left(cod_mpio_ejecucion, 2)
        when nivel = 'departamento' then cod_dpto_ejecucion
    end as cod_dpto,
    count(*) as contratos,
    {{ anio_corte }} - {{ var('anios_ventana', 5) }} as ventana_desde,
    {{ anio_corte }} as ventana_hasta,
    '{{ var("corte") }}' as corte
from ventana
group by all
order by nivel, cod_dpto

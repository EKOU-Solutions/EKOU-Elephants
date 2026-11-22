-- Gold: contratos firmados por departamento y año de firma. Cuenta todo contrato de la ventana
-- ubicado en el departamento (municipio confiable o solo departamento), no la suma de sus
-- municipios: así coincide con mapa_niveles_corte. Va aparte del gasto de CUIPO.
{% set anio_corte = "year(" ~ fecha_corte() ~ ")" %}

select
    case
        when cod_mpio_ejecucion is not null
            and confianza_ubicacion in ('alta', 'media_alta', 'media') then left(cod_mpio_ejecucion, 2)
        else cod_dpto_ejecucion
    end as cod_dpto,
    anio_firma as anio,
    count(*) as contratos,
    sum(valor_actual) filter (where valor_confiable) as valor_contratado,
    '{{ var("corte") }}' as corte
from {{ ref('contratos') }}
where estado_ejecucion not in ('antes_de_firma', 'cancelado')
    and fecha_firma <= last_day({{ fecha_corte() }})
    and anio_firma between {{ anio_corte }} - {{ var('anios_ventana', 5) }} and {{ anio_corte }}
    and (
        (cod_mpio_ejecucion is not null and confianza_ubicacion in ('alta', 'media_alta', 'media'))
        or cod_dpto_ejecucion is not null
    )
group by all

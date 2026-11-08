-- Gold: indicadores por municipio y año de firma para el Mapa Interactivo.
-- Solo entran contratos con ubicación de confianza alta, media alta o media (regla S08);
-- las sumas de valor excluyen los valores atípicos (regla A5).
with territorializados as (
    select *
    from {{ ref('contratos') }}
    where cod_mpio_ejecucion is not null
        and confianza_ubicacion in ('alta', 'media_alta', 'media')
        and estado_ejecucion not in ('antes_de_firma', 'cancelado')
        and anio_firma is not null
        -- Fechas de firma posteriores al corte son errores de digitación en origen (hasta 2099).
        and fecha_firma <= last_day({{ fecha_corte() }})
)

select
    d.cod_mpio,
    d.nom_mpio,
    d.cod_dpto,
    d.nom_dpto,
    d.latitud,
    d.longitud,
    t.anio_firma,

    count(*) as contratos,
    count(*) filter (where t.es_obra) as obras,
    sum(t.valor_actual) filter (where t.valor_confiable) as valor_contratado,
    sum(t.valor_actual) filter (where t.valor_confiable and t.es_obra) as valor_obras,
    count(*) filter (where not t.valor_confiable) as contratos_valor_excluido,

    -- Peso de SECOP I: si es alto, el municipio contrata sobre todo fuera de SECOP II.
    sum(t.valor_actual) filter (where t.valor_confiable and t.fuente = 'secop_i')
        / nullif(sum(t.valor_actual) filter (where t.valor_confiable), 0) as participacion_secop_i,

    -- Señales para las alertas (TASK-07, #8). No son conclusiones: requieren contexto.
    count(*) filter (where t.es_obra and t.estado_ejecucion = 'vencido_sin_cierre')
        as obras_vencidas_sin_cierre,
    count(*) filter (where t.estado_ejecucion = 'suspendido') as contratos_suspendidos,
    count(*) filter (where t.adicion_supera_50pct) as contratos_adicion_supera_50pct,
    count(*) filter (where {{ normalizar('t.modalidad') }} like '%DIRECTA%')
        as contratos_directos,
    count(*) filter (where t.mes_provisional) as contratos_mes_provisional,
    count(*) filter (where t.confianza_ubicacion = 'alta') / count(*) as participacion_confianza_alta,
    any_value(t.corte) as corte
from territorializados as t
inner join {{ ref('stg_divipola') }} as d on d.cod_mpio = t.cod_mpio_ejecucion
group by all

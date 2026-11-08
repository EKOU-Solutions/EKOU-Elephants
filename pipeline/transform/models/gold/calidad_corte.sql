-- Reporte de calidad del corte, por fuente: lo que se pudo usar y lo que no.
-- Se publica junto a los datos para que cualquiera evalúe su confiabilidad.
select
    fuente,
    any_value(corte) as corte,
    count(*) as contratos,
    count(*) filter (where duplicado_en_origen) as contratos_duplicados_en_origen,

    -- Ubicación (S08)
    count(*) filter (where confianza_ubicacion in ('alta', 'media_alta', 'media'))
        / count(*) as pct_en_mapa_municipal,
    count(*) filter (where confianza_ubicacion = 'alta') / count(*) as pct_ubicacion_alta,
    count(*) filter (where confianza_ubicacion = 'media_alta') / count(*) as pct_ubicacion_media_alta,
    count(*) filter (where confianza_ubicacion = 'media') / count(*) as pct_ubicacion_media,
    count(*) filter (where confianza_ubicacion = 'departamental') / count(*)
        as pct_solo_departamento,
    count(*) filter (where confianza_ubicacion = 'baja') / count(*) as pct_ubicacion_baja,
    count(*) filter (where confianza_ubicacion = 'ninguna') / count(*) as pct_sin_ubicacion,
    count(*) filter (where cod_mpio_sede is null) / count(*) as pct_sede_sin_vincular,

    -- Valores (S03, S04)
    count(*) filter (where valor_actual is null) as contratos_sin_valor,
    count(*) filter (where alerta_valor = 'error_magnitud') as alertas_error_magnitud,
    count(*) filter (where alerta_valor = 'revisar_magnitud') as alertas_revisar_magnitud,
    count(*) filter (where alerta_valor = 'supera_tope_minima_cuantia')
        as alertas_tope_minima_cuantia,
    count(*) filter (where valor_corregido_propuesto is not null) as valores_con_correccion_propuesta,
    count(*) filter (where valor_inicial is not null) / count(*) as pct_con_valor_inicial,

    -- Pagos (S05): 0 significa "no reportado"
    count(*) filter (where pago_reportado) / count(*) as pct_pago_reportado,

    -- Personas (S12)
    count(*) filter (where tipo_persona_contratista = 'natural') / count(*)
        as pct_contratistas_personas_naturales,
    count(*) filter (where tipo_persona_contratista = 'sin_documento') as contratos_sin_documento,

    -- Fechas
    count(*) filter (where fecha_firma > last_day({{ fecha_corte() }})) as contratos_firma_futura,
    count(*) filter (where mes_provisional) as contratos_mes_provisional
from {{ ref('contratos') }}
group by fuente

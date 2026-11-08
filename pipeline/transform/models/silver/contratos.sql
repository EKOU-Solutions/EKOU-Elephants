-- Capa silver: un contrato por fila, de SECOP I y SECOP II, limpio y sin datos personales.
-- Reglas: docs/investigacion-ingesta.md, sección "Reglas de silver".
with unidos as (
    select * from {{ ref('int_contratos_secop_ii') }}
    union all by name
    select * from {{ ref('int_contratos_secop_i') }}
),

con_reglas as (
    select
        u.*,
        u.valor_actual / nullif(u.valor_inicial, 0) as razon_valor,
        {{ alerta_valor('u.valor_actual', 'u.valor_inicial', 'u.modalidad', 's.smmlv') }}
            as alerta_valor,
        {{ valor_corregido('u.valor_actual', 'u.valor_inicial') }} as valor_corregido_propuesto
    from unidos as u
    left join {{ ref('smmlv') }} as s on s.anio = u.anio_firma
)

select
    fuente,
    id_contrato,
    url_proceso,
    corte,

    nit_entidad,
    nombre_entidad,
    nivel_entidad,
    cod_dpto_sede,
    cod_mpio_sede,

    -- S08: ubicación de ejecución en cascada. La confianza decide si se pinta en el mapa
    -- municipal (alta, media_alta, media) o solo en el departamental.
    case
        when n_municipios_ejecucion = 1 and not ubicacion_ambigua then cod_mpio_ubicacion
        when cod_mpio_ubicacion is null and coalesce(n_municipios_ejecucion, 0) = 0
            and nivel_entidad = 'municipal' then cod_mpio_sede
    end as cod_mpio_ejecucion,
    coalesce(
        cod_dpto_ubicacion,
        case when nivel_entidad in ('municipal', 'departamental') then cod_dpto_sede end
    ) as cod_dpto_ejecucion,
    n_municipios_ejecucion,
    case
        when n_municipios_ejecucion > 1 then 'varios_municipios'
        when n_municipios_ejecucion = 1 and ubicacion_ambigua then 'ubicacion_ambigua'
        when n_municipios_ejecucion = 1 and cod_mpio_ubicacion = cod_mpio_sede
            then 'ubicacion_igual_sede'
        when n_municipios_ejecucion = 1 then 'ubicacion_distinta_sede'
        when nivel_entidad = 'municipal' and cod_mpio_sede is not null then 'sede_alcaldia'
        else 'sin_ubicacion'
    end as fuente_ubicacion,
    case
        when n_municipios_ejecucion = 1 and not ubicacion_ambigua then
            case
                when nivel_entidad = 'municipal' and cod_mpio_ubicacion = cod_mpio_sede
                    then 'alta'
                when cod_mpio_sede is null or cod_mpio_ubicacion <> cod_mpio_sede
                    then 'media_alta'
                -- Entidades departamentales o nacionales que repiten su sede: puede ser un
                -- valor por defecto (N7).
                when nivel_entidad = 'departamental'
                    or {{ normalizar('nombre_entidad') }} like '%NACIONAL%'
                    then 'baja'
                else 'media'
            end
        when n_municipios_ejecucion > 1 then 'departamental'
        when coalesce(n_municipios_ejecucion, 0) = 0
            and nivel_entidad = 'municipal' and cod_mpio_sede is not null
            then 'media'
        else 'ninguna'
    end as confianza_ubicacion,

    tipo_contrato,
    codigo_unspsc,
    es_obra,
    modalidad,
    justificacion_modalidad,
    objeto,
    origen_de_los_recursos,

    tipo_persona_contratista,
    contratista_id,
    nombre_contratista,

    proceso_de_compra,
    id_del_proceso,
    proveedores_invitados,
    respuestas_al_proceso,
    proveedores_unicos_con_respuesta,

    fecha_firma,
    anio_firma,
    fecha_inicio,
    fecha_fin,
    fecha_fin_original,
    case
        when fecha_fin_original is not null and fecha_fin is not null
            then datediff('day', fecha_fin_original, fecha_fin)
    end as retraso_dias,
    dias_adicionados,

    valor_inicial,
    valor_actual,
    razon_valor,
    case
        when alerta_valor is null and razon_valor is not null then razon_valor - 1
    end as pct_sobrecosto,
    alerta_valor is null and razon_valor > 1.5 as adicion_supera_50pct,
    proceso_con_varios_contratos,
    alerta_valor,
    valor_corregido_propuesto,
    -- A5: las sumas públicas solo usan valores confiables.
    valor_actual is not null
        and coalesce(alerta_valor, '') not in ('error_magnitud', 'revisar_magnitud')
        as valor_confiable,
    valor_pagado,
    pago_reportado,

    estado_origen,
    estado_ejecucion,
    -- S14: SECOP II tarda días en cargar; SECOP I, hasta dos meses.
    fecha_firma >= {{ fecha_corte() }} - case fuente when 'secop_i' then interval 2 month
        else interval 1 month end as mes_provisional,
    duplicado_en_origen
from con_reglas

-- SECOP I con las mismas columnas que int_contratos_secop_ii.
-- Solo procesos con contrato firmado: el dataset también trae procesos sin adjudicar.

with contratos as (
    select
        c.*,
        {{ nivel_entidad('c.nombre_entidad') }} as nivel_entidad,
        d.cod_dpto as cod_dpto_sede,
        m.cod_mpio as cod_mpio_sede,
        -- municipios_ejecucion trae solo el nombre: los homónimos se resuelven con el
        -- departamento de la entidad.
        me.cod_mpio as cod_mpio_ubicacion,
        {{ normalizar('c.municipios_ejecucion') }} = {{ normalizar('c.departamento_entidad') }}
            as ubicacion_ambigua
    from {{ ref('stg_secop_i') }} as c
    left join {{ ref('int_departamentos') }} as d
        on d.dpto_fuente = {{ normalizar('c.departamento_entidad') }}
    left join {{ ref('int_municipios') }} as m
        on m.cod_dpto = d.cod_dpto and m.mpio_fuente = {{ normalizar('c.ciudad_entidad') }}
    left join {{ ref('int_municipios') }} as me
        on me.cod_dpto = d.cod_dpto and me.mpio_fuente = {{ normalizar('c.municipios_ejecucion') }}
    where c.fecha_firma is not null
)

select
    'secop_i' as fuente,
    c.uid as id_contrato,
    c.url_proceso,
    c.corte,
    c.duplicado_en_origen,

    c.nit_entidad,
    c.nombre_entidad,
    c.nivel_entidad,
    c.cod_dpto_sede,
    c.cod_mpio_sede,

    c.tipo_de_contrato as tipo_contrato,
    c.codigo_unspsc,
    {{ es_obra('c.tipo_de_contrato', 'c.codigo_unspsc') }} as es_obra,
    c.modalidad_de_contratacion as modalidad,
    c.causal_de_otras_formas_de as justificacion_modalidad,
    c.objeto_del_contrato as objeto,
    c.nombre_regimen_de_contratacion as origen_de_los_recursos,

    {{ tipo_persona('c.tipo_documento_contratista', 'c.documento_contratista') }}
        as tipo_persona_contratista,
    {{ contratista_id('c.tipo_documento_contratista', 'c.documento_contratista') }}
        as contratista_id,
    case
        when {{ tipo_persona('c.tipo_documento_contratista', 'c.documento_contratista') }}
            = 'juridica'
            then c.nombre_contratista
    end as nombre_contratista,

    c.numero_de_proceso as proceso_de_compra,
    cast(null as varchar) as id_del_proceso,
    cast(null as integer) as proveedores_invitados,
    cast(null as integer) as respuestas_al_proceso,
    cast(null as integer) as proveedores_unicos_con_respuesta,

    c.fecha_firma,
    year(c.fecha_firma) as anio_firma,
    c.fecha_inicio,
    c.fecha_fin,
    {{ fin_original('c.fecha_inicio', 'c.plazo', 'c.unidad_plazo') }} as fecha_fin_original,
    c.dias_adicionados,

    -- En SECOP I el valor inicial y el actual vienen en el mismo registro.
    nullif(c.valor_inicial, 0) as valor_inicial,
    c.valor_actual,
    false as proceso_con_varios_contratos,
    cast(null as decimal(38, 2)) as valor_pagado,
    false as pago_reportado,

    c.estado_del_proceso as estado_origen,
    case
        when {{ normalizar('c.estado_del_proceso') }} like 'LIQUIDADO%'
            or {{ normalizar('c.estado_del_proceso') }} like 'TERMINADO%'
            then 'terminado'
        when c.fecha_fin < {{ fecha_corte() }} then 'vencido_sin_cierre'
        when c.fecha_inicio >= {{ fecha_corte() }} then 'sin_iniciar'
        else 'activo'
    end as estado_ejecucion,

    case when c.cod_mpio_ubicacion is not null then 1 end as n_municipios_ejecucion,
    c.cod_mpio_ubicacion,
    left(c.cod_mpio_ubicacion, 2) as cod_dpto_ubicacion,
    coalesce(c.ubicacion_ambigua, false) as ubicacion_ambigua
from contratos as c

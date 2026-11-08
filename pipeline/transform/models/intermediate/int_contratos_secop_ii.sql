-- SECOP II con valor inicial, ubicación de ejecución y reglas de calidad.
-- Columnas comunes con int_contratos_secop_i; se unen en `contratos`.

with contratos as (
    select
        c.*,
        {{ nivel_entidad('c.nombre_entidad') }} as nivel_entidad,
        count(*) over (partition by c.proceso_de_compra) as contratos_en_proceso
    from {{ ref('stg_secop_contratos') }} as c
),

sede as (
    select
        c.id_contrato,
        d.cod_dpto as cod_dpto_sede,
        m.cod_mpio as cod_mpio_sede
    from contratos as c
    left join {{ ref('int_departamentos') }} as d
        on d.dpto_fuente = {{ normalizar('c.departamento_entidad') }}
    left join {{ ref('int_municipios') }} as m
        on m.cod_dpto = d.cod_dpto and m.mpio_fuente = {{ normalizar('c.ciudad_entidad') }}
),

-- S02 y S03: el contrato cruza con el proceso por id_del_portafolio. El valor inicial es el
-- adjudicado en modalidades competitivas y el precio base en contratación directa y régimen
-- especial. Solo es comparable si el proceso tiene un único contrato (sin lotes).
con_proceso as (
    select
        c.*,
        p.id_del_proceso,
        p.proveedores_invitados,
        p.respuestas,
        p.proveedores_unicos_con_respuesta,
        p.duracion,
        p.unidad_duracion,
        case
            when p.id_del_portafolio is null then null
            when {{ normalizar('c.modalidad_de_contratacion') }} like '%DIRECTA%'
                or {{ normalizar('c.modalidad_de_contratacion') }} like '%ESPECIAL%'
                then nullif(p.precio_base, 0)
            else coalesce(nullif(p.valor_adjudicado, 0), nullif(p.precio_base, 0))
        end as valor_inicial_proceso
    from contratos as c
    left join {{ ref('stg_secop_procesos') }} as p on p.id_del_portafolio = c.proceso_de_compra
)

select
    'secop_ii' as fuente,
    c.id_contrato,
    c.url_proceso,
    c.corte,
    c.duplicado_en_origen,

    -- Entidad
    c.nit_entidad,
    c.nombre_entidad,
    c.nivel_entidad,
    s.cod_dpto_sede,
    s.cod_mpio_sede,

    -- Objeto
    c.tipo_de_contrato as tipo_contrato,
    c.codigo_unspsc,
    {{ es_obra('c.tipo_de_contrato', 'c.codigo_unspsc') }} as es_obra,
    c.modalidad_de_contratacion as modalidad,
    c.justificacion_modalidad_de as justificacion_modalidad,
    c.objeto_del_contrato as objeto,
    c.origen_de_los_recursos,

    -- Contratista (S12)
    {{ tipo_persona('c.tipo_documento_contratista', 'c.documento_contratista') }}
        as tipo_persona_contratista,
    {{ contratista_id('c.tipo_documento_contratista', 'c.documento_contratista') }}
        as contratista_id,
    case
        when {{ tipo_persona('c.tipo_documento_contratista', 'c.documento_contratista') }}
            = 'juridica'
            then c.nombre_contratista
    end as nombre_contratista,

    -- Competencia
    c.proceso_de_compra,
    c.id_del_proceso,
    c.proveedores_invitados,
    c.respuestas as respuestas_al_proceso,
    c.proveedores_unicos_con_respuesta,

    -- Fechas (S06)
    c.fecha_firma,
    year(c.fecha_firma) as anio_firma,
    c.fecha_inicio,
    c.fecha_fin,
    {{ fin_original('c.fecha_inicio', 'c.duracion', 'c.unidad_duracion') }} as fecha_fin_original,
    c.dias_adicionados,

    -- Valores (S03, S05)
    case when c.contratos_en_proceso = 1 then c.valor_inicial_proceso end as valor_inicial,
    c.valor_actual,
    c.contratos_en_proceso > 1 as proceso_con_varios_contratos,
    c.valor_pagado,
    coalesce(c.valor_pagado, 0) > 0 as pago_reportado,

    -- Estado (S07)
    c.estado_contrato as estado_origen,
    case
        when {{ normalizar('c.estado_contrato') }} in ('BORRADOR', 'EN APROBACION', 'ENVIADO PROVEEDOR')
            then 'antes_de_firma'
        when {{ normalizar('c.estado_contrato') }} = 'CANCELADO' then 'cancelado'
        when {{ normalizar('c.estado_contrato') }} in ('TERMINADO', 'CERRADO') then 'terminado'
        when {{ normalizar('c.estado_contrato') }} = 'SUSPENDIDO' then 'suspendido'
        when {{ normalizar('c.estado_contrato') }} = 'APROBADO'
            and (c.fecha_inicio is null or c.fecha_inicio >= {{ fecha_corte() }})
            then 'sin_iniciar'
        when c.fecha_fin < {{ fecha_corte() }} then 'vencido_sin_cierre'
        else 'activo'
    end as estado_ejecucion,

    -- Ubicación de ejecución (S08)
    u.n_municipios as n_municipios_ejecucion,
    u.cod_mpio as cod_mpio_ubicacion,
    u.cod_dpto as cod_dpto_ubicacion,
    coalesce(u.ubicacion_ambigua, false) as ubicacion_ambigua
from con_proceso as c
left join sede as s on s.id_contrato = c.id_contrato
left join {{ ref('int_ubicacion_secop_ii') }} as u on u.id_contrato = c.id_contrato

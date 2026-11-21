-- Gold: one row per contract that has a detail page (TASK-12).
-- API contract: docs/design/pages/contract-detail/contract.md.
-- Same universe as the map (mapa_municipios + mapa_municipios_corte): contracts signed in the
-- window, located in one municipality with reliable confidence (rule S08).
-- A view: it only renames and filters silver, and the export reads it once per cut.
{{ config(materialized='view') }}

{% set cut_year = "year(" ~ fecha_corte() ~ ")" %}

select
    c.id_contrato as id,
    c.fuente as source,
    c.url_proceso as source_url,
    nullif(trim(c.objeto), '') as description,
    c.tipo_contrato as contract_type,
    coalesce(c.es_obra, false) as is_public_works,
    c.modalidad as procurement_method,
    c.justificacion_modalidad as method_justification,
    case c.estado_ejecucion
        when 'sin_iniciar' then 'not_started'
        when 'activo' then 'active'
        when 'suspendido' then 'suspended'
        when 'terminado' then 'finished'
        when 'vencido_sin_cierre' then 'expired_unclosed'
    end as status,
    c.estado_origen as source_status,
    coalesce(c.mes_provisional, false) as provisional,

    c.nombre_entidad as buyer_name,
    c.nit_entidad as buyer_tax_id,

    -- TASK-08: a natural person is never identified. No name, no document, no pseudonym.
    case c.tipo_persona_contratista
        when 'juridica' then 'company'
        when 'natural' then 'natural_person'
        else 'unknown'
    end as supplier_kind,
    case when c.tipo_persona_contratista = 'juridica' then c.nombre_contratista end
        as supplier_name,
    case
        when c.tipo_persona_contratista = 'juridica' and c.contratista_id like 'nit:%'
            then substr(c.contratista_id, 5)
    end as supplier_tax_id,

    -- The department comes from DIVIPOLA: a few rows of silver disagree with their municipality.
    d.cod_mpio as municipality_code,
    d.nom_mpio as municipality_name,
    d.cod_dpto as department_code,
    d.nom_dpto as department_name,

    c.fecha_firma as signed_on,
    c.fecha_inicio as starts_on,
    c.fecha_fin as ends_on,
    -- 0 means "none reported", and SECOP under-reports it (rule S06): missing, not zero.
    case when c.dias_adicionados > 0 then c.dias_adicionados end as added_days,

    {{ cents('c.valor_actual') }} as current_cents,
    {{ cents('c.valor_inicial') }} as initial_cents,
    -- Only between two real amounts: a negative value in the source gives a change below -100 %.
    case when c.valor_inicial > 0 and c.valor_actual >= 0 then round(c.pct_sobrecosto, 4) end
        as change_pct,
    coalesce(c.adicion_supera_50pct, false) as exceeds_legal_addition_limit,
    coalesce(c.valor_confiable, false)
        and c.valor_actual * 100 <= {{ max_safe_cents() }} as amount_reliable,
    -- valor_pagado = 0 means "not reported", never "not paid" (rule S05).
    case when c.pago_reportado then {{ cents('c.valor_pagado') }} end as paid_cents,

    c.corte as cut
from {{ ref('contratos') }} as c
inner join {{ ref('stg_divipola') }} as d on d.cod_mpio = c.cod_mpio_ejecucion
where c.confianza_ubicacion in ('alta', 'media_alta', 'media')
    and c.estado_ejecucion not in ('antes_de_firma', 'cancelado')
    and c.anio_firma between {{ cut_year }} - {{ var('anios_ventana', 5) }} and {{ cut_year }}
    -- Signing dates after the cut are typing errors in the source (up to 2099).
    and c.fecha_firma <= last_day({{ fecha_corte() }})

-- SECOP II Contratos con tipos de dato y una fila por contrato.
-- Regla S01: la fuente trae ~272 contratos repetidos; se conserva la versión más reciente.
with tipado as (
    select
        id_contrato,
        proceso_de_compra,
        referencia_del_contrato,
        {{ solo_digitos('nit_entidad') }} as nit_entidad,
        nombre_entidad,
        codigo_entidad,
        {{ sin_dato('departamento') }} as departamento_entidad,
        {{ sin_dato('ciudad') }} as ciudad_entidad,
        orden,
        sector,
        tipo_de_contrato,
        codigo_de_categoria_principal as codigo_unspsc,
        modalidad_de_contratacion,
        justificacion_modalidad_de,
        estado_contrato,
        objeto_del_contrato,
        {{ fecha('fecha_de_firma') }} as fecha_firma,
        {{ fecha('fecha_de_inicio_del_contrato') }} as fecha_inicio,
        {{ fecha('fecha_de_fin_del_contrato') }} as fecha_fin,
        duraci_n_del_contrato as duracion_texto,
        tipodocproveedor as tipo_documento_contratista,
        documento_proveedor as documento_contratista,
        proveedor_adjudicado as nombre_contratista,
        {{ monto('valor_del_contrato') }} as valor_actual,
        {{ monto('valor_pagado') }} as valor_pagado,
        {{ monto('valor_facturado') }} as valor_facturado,
        try_cast(dias_adicionados as integer) as dias_adicionados,
        liquidaci_n as requiere_liquidacion,
        origen_de_los_recursos,
        {{ url('urlproceso') }} as url_proceso,
        try_cast(ultima_actualizacion as timestamp) as ultima_actualizacion,
        _socrata_id,
        _corte as corte
    from {{ bronze('secop_contratos') }}
)

select
    *,
    count(*) over (partition by id_contrato) > 1 as duplicado_en_origen
from tipado
where id_contrato is not null
qualify row_number() over (
    partition by id_contrato
    order by ultima_actualizacion desc nulls last, _socrata_id desc
) = 1

-- SECOP I con tipos de dato y una fila por uid.
-- Regla S01: 6,48 M filas para 6,28 M uid; sin deduplicar, las sumas se inflan.
with tipado as (
    select
        uid,
        numero_de_proceso,
        numero_de_contrato,
        {{ solo_digitos('nit_de_la_entidad') }} as nit_entidad,
        nombre_entidad,
        c_digo_de_la_entidad as codigo_entidad,
        nivel_entidad,
        orden_entidad,
        {{ sin_dato('departamento_entidad') }} as departamento_entidad,
        {{ sin_dato('municipio_entidad') }} as ciudad_entidad,
        {{ sin_dato('municipios_ejecucion') }} as municipios_ejecucion,
        modalidad_de_contratacion,
        causal_de_otras_formas_de,
        nombre_regimen_de_contratacion,
        estado_del_proceso,
        tipo_de_contrato,
        id_clase as codigo_unspsc,
        detalle_del_objeto_a_contratar as objeto_del_contrato,
        tipo_identifi_del_contratista as tipo_documento_contratista,
        identificacion_del_contratista as documento_contratista,
        nom_razon_social_contratista as nombre_contratista,
        {{ fecha('fecha_de_cargue_en_el_secop') }} as fecha_cargue,
        {{ fecha('fecha_de_firma_del_contrato') }} as fecha_firma,
        {{ fecha('fecha_ini_ejec_contrato') }} as fecha_inicio,
        {{ fecha('fecha_fin_ejec_contrato') }} as fecha_fin,
        try_cast(plazo_de_ejec_del_contrato as double) as plazo,
        {{ normalizar('rango_de_ejec_del_contrato') }} as unidad_plazo,
        try_cast(tiempo_adiciones_en_dias as integer) as dias_adicionados,
        {{ monto('cuantia_proceso') }} as cuantia_proceso,
        {{ monto('cuantia_contrato') }} as valor_inicial,
        {{ monto('valor_total_de_adiciones') }} as valor_adiciones,
        {{ monto('valor_contrato_con_adiciones') }} as valor_actual,
        {{ sin_dato('codigo_bpin') }} as codigo_bpin,
        {{ url('ruta_proceso_en_secop_i') }} as url_proceso,
        try_cast(ultima_actualizacion as timestamp) as ultima_actualizacion,
        _socrata_id,
        _corte as corte
    from {{ bronze('secop_i') }}
)

select
    *,
    count(*) over (partition by uid) > 1 as duplicado_en_origen
from tipado
where uid is not null
qualify row_number() over (
    partition by uid
    order by ultima_actualizacion desc nulls last, _socrata_id desc
) = 1

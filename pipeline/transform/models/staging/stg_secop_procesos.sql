-- SECOP II Procesos: una fila por portafolio, la llave que usan los contratos (regla S02).
-- Un portafolio tiene varias filas (fases y publicaciones); se conserva la adjudicada.
with tipado as (
    select
        id_del_portafolio,
        id_del_proceso,
        modalidad_de_contratacion,
        {{ monto('precio_base') }} as precio_base,
        {{ monto('valor_total_adjudicacion') }} as valor_adjudicado,
        try_cast(duracion as double) as duracion,
        {{ normalizar('unidad_de_duracion') }} as unidad_duracion,
        try_cast(proveedores_invitados as integer) as proveedores_invitados,
        try_cast(respuestas_al_procedimiento as integer) as respuestas,
        try_cast(proveedores_unicos_con as integer) as proveedores_unicos_con_respuesta,
        try_cast(numero_de_lotes as integer) as numero_de_lotes,
        estado_resumen,
        {{ fecha('fecha_de_publicacion_del') }} as fecha_publicacion,
        {{ fecha('fecha_adjudicacion') }} as fecha_adjudicacion,
        _socrata_id
    from {{ bronze('secop_procesos') }}
    where id_del_portafolio is not null
)

select
    *,
    count(*) over (partition by id_del_portafolio) as filas_en_origen
from tipado
qualify row_number() over (
    partition by id_del_portafolio
    order by
        coalesce(valor_adjudicado, 0) > 0 desc,
        precio_base desc nulls last,
        fecha_publicacion desc nulls last,
        _socrata_id desc
) = 1

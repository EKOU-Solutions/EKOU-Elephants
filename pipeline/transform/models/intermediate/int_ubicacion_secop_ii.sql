-- Municipios de ejecución declarados en SECOP II, por contrato (fuente: gra4-pcp2).
-- Una ubicación igual al departamento ("Boyacá»Boyacá") puede significar "todo el
-- departamento": se marca para no darle confianza alta.
with ubicaciones as (
    select
        u.id_contrato,
        d.cod_dpto,
        m.cod_mpio,
        u.mpio_norm = u.dpto_norm as nombre_igual_al_departamento
    from {{ ref('stg_secop_ubicaciones') }} as u
    left join {{ ref('int_departamentos') }} as d on d.dpto_fuente = u.dpto_norm
    left join {{ ref('int_municipios') }} as m
        on m.cod_dpto = d.cod_dpto and m.mpio_fuente = u.mpio_norm
)

select
    id_contrato,
    count(distinct cod_mpio) as n_municipios,
    count(*) filter (where cod_mpio is null) as n_ubicaciones_sin_vincular,
    count(distinct cod_dpto) as n_departamentos,
    case when count(distinct cod_mpio) = 1 then min(cod_mpio) end as cod_mpio,
    case when count(distinct cod_dpto) = 1 then min(cod_dpto) end as cod_dpto,
    bool_or(nombre_igual_al_departamento) as ubicacion_ambigua
from ubicaciones
group by id_contrato

-- Toda entidad de municipios (A439) debe resolver a un municipio de DIVIPOLA; si no, se pierde su gasto.
select e.codigo_entidad, e.cod_mpio
from {{ ref('int_cuipo_entidades') }} as e
left join {{ ref('stg_divipola') }} as d on d.cod_mpio = e.cod_mpio
where e.ambito_codigo = 'A439' and d.cod_mpio is null

-- Diccionario (departamento, nombre normalizado de municipio) → código DANE.
-- Siempre por el par: 67 nombres se repiten entre departamentos (La Unión, Granada…).
select cod_dpto, mpio_norm as mpio_fuente, cod_mpio, 'divipola' as origen
from {{ ref('stg_divipola') }}

union all

select a.cod_dpto, {{ normalizar('a.mpio_fuente') }}, a.cod_mpio, 'alias' as origen
from {{ ref('alias_municipios') }} as a
where not exists (
    select 1
    from {{ ref('stg_divipola') }} as d
    where d.cod_dpto = a.cod_dpto and d.mpio_norm = {{ normalizar('a.mpio_fuente') }}
)

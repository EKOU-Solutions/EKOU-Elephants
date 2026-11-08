-- Diccionario nombre normalizado de departamento → código DANE (DIVIPOLA + alias).
select distinct dpto_norm as dpto_fuente, cod_dpto
from {{ ref('stg_divipola') }}

union

select {{ normalizar('dpto_fuente') }}, cod_dpto
from {{ ref('alias_departamentos') }}

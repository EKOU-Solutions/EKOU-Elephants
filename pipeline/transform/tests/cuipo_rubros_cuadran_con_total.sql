{{ config(severity='warn') }}
-- La cuenta 2 (total del gasto) debe ser la suma de funcionamiento, deuda e inversión (2.1+2.2+2.3).
-- Tolera 1 peso por redondeo.
with total as (
    select codigo_entidad, periodo, vigencia, comprometido
    from {{ ref('stg_cuipo_gastos') }}
    where cuenta = '2'
),

rubros as (
    select codigo_entidad, periodo, vigencia, sum(comprometido) as comprometido
    from {{ ref('stg_cuipo_gastos') }}
    where cuenta in ('2.1', '2.2', '2.3')
    group by all
)

select t.codigo_entidad, t.periodo, t.vigencia, t.comprometido as total, r.comprometido as rubros
from total as t
inner join rubros as r using (codigo_entidad, periodo, vigencia)
where abs(t.comprometido - r.comprometido) > 1

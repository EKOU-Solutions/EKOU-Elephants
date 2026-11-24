-- Gold: gasto público por territorio, año, vigencia y rubro (CUIPO). Alimenta el resumen
-- municipal y el de departamento (nivel = 'municipio' | 'departamento').
-- Rubros: 2.1 funcionamiento, 2.2 deuda, 2.3 inversión. `recibido` es el recaudo del año
-- (mismo periodo del gasto) y se repite en cada fila del territorio y año; null si no reportó.
select
    t.nivel,
    t.cod_dpto,
    t.cod_mpio,
    t.alcance,
    p.anio,
    p.periodo,
    g.vigencia,
    case g.cuenta
        when '2.1' then 'funcionamiento'
        when '2.2' then 'deuda'
        when '2.3' then 'inversion'
    end as rubro,
    g.comprometido,
    g.obligado,
    g.pagado,
    i.recaudo as recibido,
    '{{ var("corte") }}' as corte
from {{ ref('stg_cuipo_gastos') }} as g
inner join {{ ref('int_cuipo_periodo') }} as p
    on p.codigo_entidad = g.codigo_entidad and p.periodo = g.periodo
inner join {{ ref('int_cuipo_entidades') }} as t on t.codigo_entidad = g.codigo_entidad
left join {{ ref('stg_cuipo_ingresos') }} as i
    on i.codigo_entidad = g.codigo_entidad and i.periodo = g.periodo
where g.cuenta in ('2.1', '2.2', '2.3')

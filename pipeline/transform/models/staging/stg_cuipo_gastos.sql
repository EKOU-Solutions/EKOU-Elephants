-- CUIPO, ejecución de gastos. El origen trae varias filas por entidad, periodo, cuenta y
-- vigencia (una por sección presupuestal o fuente), así que aquí se suman. Los valores del
-- informe son acumulados del año: nunca se suman periodos entre sí.
-- Vigencias: 1 actual, 2 reservas, 3 cuentas por pagar. Las 4 a 6 (vigencias futuras y otras)
-- no entran al resumen.
select
    codigo_entidad,
    ambito_codigo,
    try_strptime(periodo, '%Y%m%d')::date as periodo,
    cuenta,
    try_cast(cod_vigencia_del_gasto as integer) as vigencia,
    sum(try_cast(compromisos as decimal(24, 2))) as comprometido,
    sum(try_cast(obligaciones as decimal(24, 2))) as obligado,
    sum(try_cast(pagos as decimal(24, 2))) as pagado
from {{ bronze('cuipo_gastos') }}
where try_cast(cod_vigencia_del_gasto as integer) in (1, 2, 3)
group by all

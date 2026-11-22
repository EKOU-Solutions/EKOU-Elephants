-- Cobertura del último año completo: unos 1.090 municipios con gasto de vigencia actual y los
-- 33 departamentos (31 gobernaciones, Bogotá y San Andrés). Una caída fuerte es una carga a medias.
with ultimo as (
    select max(anio) as anio from {{ ref('resumen_gasto_cuipo') }} where extract(month from periodo) = 12
),

cobertura as (
    select
        count(distinct cod_mpio) filter (where nivel = 'municipio') as municipios,
        count(distinct cod_dpto) filter (where nivel = 'departamento') as departamentos
    from {{ ref('resumen_gasto_cuipo') }}
    where anio = (select anio from ultimo) and vigencia = 1
)

select * from cobertura where municipios < {{ env_var('EKOU_CUIPO_MIN_MUNICIPIOS', '1050') }}
    or departamentos < {{ env_var('EKOU_CUIPO_MIN_DEPARTAMENTOS', '33') }}

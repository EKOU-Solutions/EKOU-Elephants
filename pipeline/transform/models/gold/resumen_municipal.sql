-- Gold: contratos firmados por municipio y año de firma, para el resumen municipal.
-- Es lo prometido en contratos de SECOP, no lo gastado: va aparte del gasto de CUIPO.
-- Mismos filtros que mapa_municipios (regla S08; los valores atípicos no suman). Solo hay fila
-- donde hay contratos: sin fila = sin información, nunca cero.
{% set anio_corte = "year(" ~ fecha_corte() ~ ")" %}

select
    cod_mpio,
    anio_firma as anio,
    contratos,
    valor_contratado,
    corte
from {{ ref('mapa_municipios') }}
where anio_firma between {{ anio_corte }} - {{ var('anios_ventana', 5) }} and {{ anio_corte }}

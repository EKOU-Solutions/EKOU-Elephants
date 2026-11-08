{#- Reglas de silver compartidas por SECOP I y SECOP II.
    Cada regla cita su identificador en docs/investigacion-ingesta.md. -#}


{#- S09: nivel de la entidad por su nombre. El campo `orden` de SECOP está mal asignado
    (hay alcaldías marcadas como "Nacional"). Respaldo hasta cruzar con CHIP por NIT. -#}
{% macro nivel_entidad(nombre) -%}
case
    when regexp_matches({{ normalizar(nombre) }}, '^(ALCALDIA|MUNICIPIO|DISTRITO)')
        and not regexp_matches({{ normalizar(nombre) }}, 'CONCEJO|PERSONERIA|ALCALDIA LOCAL')
        then 'municipal'
    when regexp_matches({{ normalizar(nombre) }}, '^(GOBERNACION|DEPARTAMENTO)')
        then 'departamental'
    else 'otro'
end
{%- endmacro %}


{#- S12: tipo de persona del contratista. Ante la duda se trata como persona natural:
    es preferible seudonimizar de más que publicar una cédula. -#}
{% macro tipo_persona(tipo_documento, documento) -%}
case
    when {{ normalizar(tipo_documento) }} in (
        'NIT DE PERSONA JURIDICA', 'SOCIEDADES EXTRANJERAS', 'NIT DE EXTRANJERIA'
    ) then 'juridica'
    when {{ normalizar(tipo_documento) }} = 'NIT'
        and regexp_matches(coalesce({{ solo_digitos(documento) }}, ''), '^[89][0-9]{8,9}$')
        then 'juridica'
    when {{ solo_digitos(documento) }} is null then 'sin_documento'
    else 'natural'
end
{%- endmacro %}


{#- S12: identificador público del contratista. NIT sin dígito de verificación para personas
    jurídicas; seudónimo HMAC-SHA256 para todo lo demás. -#}
{% macro contratista_id(tipo_documento, documento) -%}
case {{ tipo_persona(tipo_documento, documento) }}
    when 'juridica' then 'nit:' || left({{ solo_digitos(documento) }}, 9)
    when 'natural' then ekou_seudonimo({{ solo_digitos(documento) }})
end
{%- endmacro %}


{#- S10: obra pública. Muchas obras municipales no dicen "Obra" (convenios del Decreto 092
    de 2017, "Otro"); el código UNSPSC 72 (servicios de construcción) las identifica. -#}
{% macro es_obra(tipo_contrato, codigo_unspsc) -%}
(
    {{ normalizar(tipo_contrato) }} = 'OBRA'
    or regexp_matches(coalesce({{ codigo_unspsc }}, ''), '^(V1\.)?72')
)
{%- endmacro %}


{#- S06: fecha de fin original = inicio + duración pactada. -#}
{% macro fin_original(inicio, duracion, unidad) -%}
cast(case
    when {{ inicio }} is null or {{ duracion }} is null or {{ duracion }} <= 0 then null
    -- SECOP II trae duraciones imposibles (hasta 915 M de días) que sacan la fecha del
    -- rango de DuckDB. Más de 100 años no es un plazo real: la fecha queda sin calcular.
    when ({{ unidad }} like 'DIA%' or {{ unidad }} = 'D') and {{ duracion }} > 36525 then null
    when ({{ unidad }} like 'SEMANA%' or {{ unidad }} = 'S') and {{ duracion }} > 5218 then null
    when ({{ unidad }} like 'MES%' or {{ unidad }} = 'M') and {{ duracion }} > 1200 then null
    when ({{ unidad }} like 'ANO%' or {{ unidad }} = 'A') and {{ duracion }} > 100 then null
    when {{ unidad }} like 'DIA%' or {{ unidad }} = 'D'
        then {{ inicio }} + to_days(cast(round({{ duracion }}) as integer))
    when {{ unidad }} like 'SEMANA%' or {{ unidad }} = 'S'
        then {{ inicio }} + to_days(cast(round({{ duracion }} * 7) as integer))
    when {{ unidad }} like 'MES%' or {{ unidad }} = 'M'
        then {{ inicio }} + to_months(cast(round({{ duracion }}) as integer))
    when {{ unidad }} like 'ANO%' or {{ unidad }} = 'A'
        then {{ inicio }} + to_years(cast(round({{ duracion }}) as integer))
end as date)
{%- endmacro %}


{#- S04: valores atípicos por magnitud (reglas A1 a A4). Se marcan, nunca se borran. -#}
{% macro alerta_valor(valor_actual, valor_inicial, modalidad, smmlv) -%}
case
    -- A0: ningún contrato público colombiano llega a $50 billones (el Metro de Bogotá ronda
    -- los $20). Hace falta aunque el valor inicial coincida: el proceso trae el mismo error.
    when {{ valor_actual }} > 5e13 then 'error_magnitud'
    when {{ valor_inicial }} > 0 and {{ valor_actual }} / {{ valor_inicial }} > 100
        then 'error_magnitud'
    when {{ valor_actual }} > 2e12
        and ({{ valor_inicial }} is null or {{ valor_actual }} / {{ valor_inicial }} > 1.5)
        then 'revisar_magnitud'
    -- A3b: más de 10 veces el tope legal ya no es una mínima cuantía; el valor o la
    -- modalidad están mal y no se puede saber cuál, así que no entra a las sumas.
    when {{ normalizar(modalidad) }} like '%MINIMA CUANTIA%'
        and {{ valor_actual }} > 1500 * cast({{ smmlv }} as bigint)
        then 'revisar_magnitud'
    when {{ normalizar(modalidad) }} like '%MINIMA CUANTIA%'
        and {{ valor_actual }} > 150 * cast({{ smmlv }} as bigint)
        then 'supera_tope_minima_cuantia'
end
{%- endmacro %}


{#- A2: si la razón es casi una potencia de 10 (k >= 2), propone el valor corregido. -#}
{% macro valor_corregido(valor_actual, valor_inicial) -%}
case
    when {{ valor_inicial }} > 0 and {{ valor_actual }} / {{ valor_inicial }} >= 95
        and abs(
            {{ valor_actual }} / {{ valor_inicial }}
            / pow(10, round(log10({{ valor_actual }} / {{ valor_inicial }})))
            - 1
        ) <= 0.02
        then {{ valor_actual }} / pow(10, round(log10({{ valor_actual }} / {{ valor_inicial }})))
end
{%- endmacro %}

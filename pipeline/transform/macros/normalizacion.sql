{#- Nombre comparable: mayúsculas, sin tildes, sin puntuación y con espacios simples.
    "Santafé De Antioquia" y "SANTA FÉ DE ANTIOQUIA" quedan iguales salvo por el espacio,
    que se resuelve con la tabla de alias. -#}
{% macro normalizar(columna) -%}
nullif(trim(regexp_replace(
    regexp_replace(strip_accents(upper(coalesce({{ columna }}, ''))), '[^A-Z0-9Ñ ]', ' ', 'g'),
    ' +', ' ', 'g'
)), '')
{%- endmacro %}

{#- Valores que SECOP usa para "sin dato". -#}
{% macro sin_dato(columna) -%}
case
    when {{ normalizar(columna) }} in ('NO DEFINIDO', 'NO APLICA', 'NA', 'N A', 'NULL', 'SIN DESCRIPCION')
        then null
    else {{ columna }}
end
{%- endmacro %}

{#- Documento como solo dígitos, sin ceros a la izquierda. -#}
{% macro solo_digitos(columna) -%}
nullif(ltrim(regexp_replace(coalesce({{ columna }}, ''), '[^0-9]', '', 'g'), '0'), '')
{%- endmacro %}

{#- Monto en pesos. Los errores de formato quedan en nulo y se cuentan en el reporte. -#}
{% macro monto(columna) -%}
try_cast({{ columna }} as decimal(38, 2))
{%- endmacro %}

{% macro fecha(columna) -%}
cast(try_cast({{ columna }} as timestamp) as date)
{%- endmacro %}

{#- Socrata entrega las URL como objeto {"url": "..."}; bronze las guarda como JSON. -#}
{% macro url(columna) -%}
case
    when starts_with({{ columna }}, chr(123)) then json_extract_string({{ columna }}, '$.url')
    else {{ columna }}
end
{%- endmacro %}

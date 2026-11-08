{#- Lee una fuente de la capa bronze del corte actual. Todo llega como texto. -#}
{% macro bronze(fuente) -%}
read_parquet(
    '{{ var("data_dir") }}/bronze/corte={{ var("corte") }}/fuente={{ fuente }}/*/*.parquet',
    union_by_name = true
)
{%- endmacro %}

{#- Primer día del mes del corte: referencia para "vencido" y "provisional". -#}
{% macro fecha_corte() -%}
cast('{{ var("corte") }}-01' as date)
{%- endmacro %}

{#- Largest amount in cents that JavaScript reads without losing precision (Number.MAX_SAFE_INTEGER). -#}
{% macro max_safe_cents() -%}
9007199254740991
{%- endmacro %}


{#- Pesos to exact integer cents. Null when negative or too large to be a real amount. -#}
{% macro cents(column) -%}
case
    when {{ column }} >= 0 and {{ column }} * 100 <= {{ max_safe_cents() }}
        then cast(round({{ column }} * 100) as bigint)
end
{%- endmacro %}

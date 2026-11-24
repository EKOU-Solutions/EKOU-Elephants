{#- Falla si alguna combinación de columnas se repite. -#}
{% test unique_combination(model, columns) %}
select {{ columns | join(', ') }}, count(*) as repeticiones
from {{ model }}
group by {{ columns | join(', ') }}
having count(*) > 1
{% endtest %}


{#- Falla si alguna fila tiene la columna en 0 o negativa: la ausencia de datos va como null. -#}
{% test mayor_que_cero(model, column_name) %}
select {{ column_name }}
from {{ model }}
where {{ column_name }} <= 0
{% endtest %}


{#- Falla si hay filas de un año anterior a 2023: CUIPO no publica antes. -#}
{% test anio_desde_2023(model, column_name) %}
select {{ column_name }}
from {{ model }}
where {{ column_name }} < 2023
{% endtest %}

-- Regla S12: ninguna persona natural puede quedar identificada en la capa pública.
-- Devuelve las filas que violan la regla; dbt falla si hay al menos una.
select fuente, id_contrato, tipo_persona_contratista
from {{ ref('contratos') }}
where tipo_persona_contratista <> 'juridica'
    and (
        nombre_contratista is not null
        or (contratista_id is not null and contratista_id not like 'k1\_%' escape '\')
    )

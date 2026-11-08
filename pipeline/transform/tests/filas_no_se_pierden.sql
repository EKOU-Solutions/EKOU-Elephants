-- Silver no puede perder contratos de SECOP II: cada id_contrato de staging debe estar.
select s.id_contrato
from {{ ref('stg_secop_contratos') }} as s
left join {{ ref('contratos') }} as c
    on c.fuente = 'secop_ii' and c.id_contrato = s.id_contrato
where c.id_contrato is null

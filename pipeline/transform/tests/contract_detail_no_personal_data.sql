-- TASK-08: the contract detail never identifies a natural person.
-- Returns the rows that break the rule; dbt fails if there is at least one.
select id, supplier_kind
from {{ ref('contract_detail') }}
where supplier_kind <> 'company'
    and (supplier_name is not null or supplier_tax_id is not null)

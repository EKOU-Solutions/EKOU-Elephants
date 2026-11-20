-- Fails if a contract links anywhere but an https address: the API rejects the whole record.
select id, source_url
from {{ ref('contract_detail') }}
where source_url is not null and source_url not like 'https://%'

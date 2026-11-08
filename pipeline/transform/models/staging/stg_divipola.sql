-- Municipios del DANE con nombres normalizados para cruzar con los textos de SECOP.
select
    cod_mpio,
    cod_dpto,
    nom_mpio,
    dpto as nom_dpto,
    tipo_municipio,
    {{ normalizar('nom_mpio') }} as mpio_norm,
    {{ normalizar('dpto') }} as dpto_norm,
    try_cast(replace(latitud, ',', '.') as double) as latitud,
    try_cast(replace(longitud, ',', '.') as double) as longitud
from {{ bronze('divipola') }}

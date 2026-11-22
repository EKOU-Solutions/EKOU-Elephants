# Catálogo de datos.gov.co para desarrolladores

Qué datos hay en [datos.gov.co](https://www.datos.gov.co), cómo encontrarlos rápido y cómo consultarlos sin tropezar. Es **separado** de [`docs/fuentes-de-datos.md`](../fuentes-de-datos.md): aquella página explica las fuentes que **ya elegimos** y cómo se cruzan; esta es el **inventario completo** para descubrir candidatas nuevas.

## Cómo encontrar un dato en 30 segundos

| Quiero… | Abro |
|---|---|
| Ver las categorías y los datasets que ya usamos (✅) | [indice.md](indice.md) |
| Los datasets de un tema (columnas, entidad, última actualización) | `categorias/<tema>.md` (enlazado desde el índice) |
| Buscar por palabra | `grep -i "palabra" docs/datos-gov-co/catalogo.tsv` |
| Filtrar en una hoja de cálculo | abrir [catalogo.tsv](catalogo.tsv) (separado por tabuladores) |
| Buscar por **nombre de columna** (por ejemplo, `nit_entidad`) | `grep -l "nit_entidad" docs/datos-gov-co/categorias/*.md` |

Categorías con más relevancia para este proyecto: **Gastos Gubernamentales**, **Presupuestos Gubernamentales**, **Hacienda y Crédito Público**, **Organismos de Control**, **Función pública** (aquí vive SECOP), **Ordenamiento Territorial** (DIVIPOLA, límites) y **Comercio, Industria y Turismo** (RUES).

## Contenido de cada ficha

- **id** de 8 caracteres (`xxxx-xxxx`): es lo que se usa en la API.
- **Entidad** que publica, **fecha de última actualización de los datos** y **frecuencia** declarada.
- **Vistas**: sirve como señal de qué tan conocido y mantenido está.
- **Columnas** con su tipo Socrata (`text`, `number`, `calendar_date`, `checkbox`, `url`, `point`…).
- ✅ marca los datasets que ya cita la documentación del proyecto.

> Lo que **no** trae el catálogo: número de filas, calidad real ni cobertura. Se miden por dataset (abajo). No confíes en la frecuencia declarada: contrástala con la fecha de actualización.

## Consultar un dataset (SODA)

```text
https://www.datos.gov.co/resource/<id>.json?$select=...&$where=...&$limit=...
```

| Necesito | Cómo |
|---|---|
| Formato | `.json`, `.csv` o `.geojson` (si tiene geometría) en lugar de `.json` |
| Filas | `$limit=50000` y `$offset=` para paginar; por defecto solo devuelve **1.000** |
| Orden estable al paginar | `$order=:id` |
| Elegir columnas | `$select=col1,col2` |
| Filtrar | `$where=periodo='20260601' AND cod_vigencia_del_gasto='1'` |
| Agrupar | `$select=periodo,sum(pagos) AS p&$group=periodo` (con alias: **`AS`**, no se puede omitir) |
| Contar | `$select=count(*)` |
| Texto libre | `$q=palabra` |
| Metadatos y columnas de un dataset | `https://www.datos.gov.co/api/views/<id>.json` |
| Fecha del último dato | `$select=max(periodo)` o `rowsUpdatedAt` en los metadatos |

- **Token de aplicación:** crea uno gratuito en el portal y envíalo como cabecera `X-App-Token`. Sin token, el límite de peticiones es compartido por IP y en CI se agota.
- **Consultas pesadas:** `like '%texto%'` o agrupar sin filtrar por una columna indexada puede tardar más de dos minutos en datasets de millones de filas (nos pasó con CUIPO). Filtra primero por periodo o por código de entidad.
- **Descarga masiva:** para tablas grandes usa la exportación `.csv` completa o pagina con `$order=:id`, en lugar de miles de consultas pequeñas.

## Trampas que ya nos encontramos

1. **El JSON entrega los números como texto** (`"compromisos":"30757000"`, aunque la columna sea `Number`), y muchas columnas son `Text` aunque parezcan números. Convierte (`try_cast`) y valida; un solo valor mal escrito rompe la carga.
2. **Los códigos pierden el cero inicial.** DIVIPOLA debe tratarse como texto de 2 o 5 dígitos (`05001`, no `5001`).
3. **Valores atípicos por errores de magnitud** (un contrato de $64 millones registrado por $6,45 × 10¹⁵). Por eso el gold usa `valor_confiable`.
4. **La ciudad que reporta SECOP es la sede de la entidad, no el lugar de la obra.** El municipio de ejecución sale de `gra4-pcp2` (ubicaciones de ejecución).
5. **Una fila por versión.** El SECOP Integrado (`rpmr-utcd`) repite contratos por cada modificación: no sirve como atajo.
6. **CUIPO es acumulado en el año y llega ~50 días tras cerrar el trimestre.** No se suma entre periodos; el código de entidad es el CHIP, no el DANE.
7. **Ausencia de contratos no es ausencia de gasto.** Régimen especial, convenios y nómina no pasan por SECOP II. Un municipio sin dato es «sin información», nunca cero.
8. **El dataset puede cambiar sin aviso:** columnas renombradas o dataset reemplazado por otro id. Verifica las columnas contra la ficha antes de depender de ellas.

## Cómo evaluar un dataset candidato antes de usarlo

1. Leer su ficha (columnas y entidad) y abrir el enlace del portal para ver la descripción y la licencia.
2. `?$select=count(*)` para el tamaño y `max(<columna de fecha>)` para el rezago real.
3. Revisar 5 filas con `$limit=5` y comprobar tipos, ceros iniciales y valores vacíos.
4. Identificar la **llave de cruce** con lo que ya tenemos (`id_contrato`, NIT, DIVIPOLA, BPIN, CHIP).
5. Si pasa a usarse: registrarlo en [`fuentes-de-datos.md`](../fuentes-de-datos.md) y en `catalog.py` del pipeline.

## Regenerar esta documentación

```bash
npm run datos:catalogo                                  # descarga el catálogo completo (~2 min)
node scripts/catalogo-datos-gov-co.mjs --cache          # reusa la última descarga (.cache/)
```

El script `scripts/catalogo-datos-gov-co.mjs` lee la API pública de descubrimiento de Socrata (`api.us.socrata.com/api/catalog/v1`), solo datasets de `www.datos.gov.co`, y reescribe `indice.md`, `catalogo.tsv` y `categorias/`. **No edites esos archivos a mano**: se sobrescriben. Lo que se escriba a mano va en este README.

# ekou-pipeline

Pipeline de datos abiertos de EKOU-Elephants. Extrae cada mes la contratación pública de Colombia (SECOP I y SECOP II) desde [datos.gov.co](https://www.datos.gov.co), a escala nacional, y la convierte en tablas consultables para el mapa.

```
datos.gov.co ──extract──▶ bronze (Parquet, tal como llega) ──transform (dbt + DuckDB)──▶ silver: contratos ──▶ gold: mapa_municipios, calidad_corte
```

Los resultados del corte 2026-11 (volúmenes, tiempos, calidad y limitaciones) están en [resultados de la POC](../docs/resultados-poc.md).

Las decisiones de diseño, alternativas y mediciones están en el [ADR 0002](../docs/adr/0002-ingesta-de-datos.md). La evidencia sobre la calidad de cada fuente y las reglas de limpieza están en la [investigación de ingesta](../docs/investigacion-ingesta.md). Las fuentes están descritas en [fuentes de datos](../docs/fuentes-de-datos.md).

## Fuentes del primer corte

| Clave | Dataset | Filas (nov. 2026) | Partición |
|---|---|---|---|
| `secop_contratos` | SECOP II – Contratos (`jbjy-vk9h`) | 5,7 M | Año de firma |
| `secop_procesos` | SECOP II – Procesos (`p6dx-8zbt`) | 9,4 M | Año de publicación |
| `secop_ubicaciones` | SECOP II – Ubicaciones de ejecución (`gra4-pcp2`) | 6,5 M | Primer dígito de `id_contrato` (9 bloques) |
| `secop_i` | SECOP I – Procesos de compra (`f789-7hwg`) | 6,5 M | Año de firma; fechas antes de 2014 o futuras en `fuera_de_rango` |
| `divipola` | DANE – Municipios (`gdxc-w37w`) | 1.122 | Única |

El catálogo excluye desde la extracción las cuentas bancarias, los domicilios y los datos de representantes legales, supervisores y ordenadores del gasto.

## Requisitos

- Python 3.12+
- [uv](https://docs.astral.sh/uv/)
- Para el corte nacional completo: 16 GB de RAM y ~35 GB libres en disco (3 GB de bronze, 7 GB de base DuckDB y hasta 20 GB de temporales durante `transform`). Las pruebas no necesitan nada de esto: usan un bronze de ejemplo.
- `EKOU_PSEUDONYM_KEY`: clave de al menos 32 caracteres para seudonimizar las cédulas de personas naturales. Para probar localmente sirve cualquier valor; la del corte publicado es un secreto del repositorio.

## Uso

```bash
cd pipeline
uv sync

# Extrae SECOP II Contratos y DIVIPOLA a la capa bronze, para el corte 2026-11
uv run ekou-pipeline extract secop_contratos secop_procesos secop_ubicaciones secop_i divipola --corte 2026-11
```

Los datos quedan en `data/bronze/corte=2026-11/fuente=<fuente>/particion=<año>/`. Al terminar, el comando imprime un reporte JSON con filas extraídas, filas esperadas y tiempos por partición.

Si la ejecución se interrumpe, al volver a lanzarla **solo se extraen las particiones que faltan**. Una partición ya extraída se vuelve a extraer si cambian sus columnas en el catálogo o si el origen tiene otro número de filas en ella (por ejemplo, porque una recarga de datos.gov.co que estaba a medias ya se completó). Las particiones que ya no existen en el origen se borran.

Antes de extraer, el pipeline verifica que las particiones cubran exactamente el `count(*)` del dataset.

Después de extraer, `transform` construye silver y gold y ejecuta las pruebas de datos:

```bash
uv run ekou-pipeline transform --corte 2026-11
```

El resultado queda en `data/ekou.duckdb` y se consulta con cualquier cliente de DuckDB:

```bash
uv run python -c "import duckdb; print(duckdb.connect('data/ekou.duckdb', read_only=True).sql('select * from calidad_corte'))"
```

Si una prueba de datos falla (por ejemplo, una cédula sin seudonimizar o un contrato que se pierde entre capas), el comando termina con código 1 y el corte no se publica.

Después, `compuertas` revisa el corte en conjunto. Las pruebas de dbt detectan datos malos; las compuertas detectan un corte que se ve mal, como una vista de SECOP que queda vacía sin dar error. Por ejemplo, el 15 de noviembre de 2026 SECOP II Procesos quedó con 1.000 filas de 9,4 M en datos.gov.co, y su `count(*)` también decía 1.000. Con `--anterior` compara contra el `calidad_corte.csv` del corte publicado anterior. Imprime una tabla con cada compuerta y termina con código 1 si alguna falla.

```bash
uv run ekou-pipeline compuertas --corte 2026-12 --anterior calidad_corte_2026-11.csv
```

| Compuerta | Umbral por defecto | Variable |
|---|---|---|
| Cada fuente del catálogo trae al menos su mínimo de filas en bronze | ~90 % del corte 2026-11 (por ejemplo, 8,5 M en SECOP II Procesos) | `min_rows` en [`catalog.py`](src/ekou_pipeline/catalog.py) |
| Cada fuente (SECOP I y II) tiene contratos | > 0 | — |
| Contratos de cada fuente ubicados en un municipio del mapa | ≥ 80 % (2026-11: 88,3 % y 84,3 %) | `EKOU_GATE_MIN_PCT_MAPA` |
| Municipios con al menos un contrato | ≥ 1.050 (2026-11: 1.106 de 1.122) | `EKOU_GATE_MIN_MUNICIPIOS` |
| Caída de contratos de cada fuente frente al corte anterior | ≤ 1 % | `EKOU_GATE_MAX_CAIDA_CONTRATOS` |
| Caída del porcentaje de ubicados frente al corte anterior | ≤ 2 puntos | `EKOU_GATE_MAX_CAIDA_PCT_MAPA` |

Por último, `export` escribe los archivos abiertos del corte en `data/publicacion/<corte>/`: `contratos.parquet`; `mapa_municipios` y `calidad_corte` en Parquet, CSV y JSON; y un `resumen.md` con el reporte de calidad. Antes de exportar comprueba que la base contenga ese mismo corte.

```bash
uv run ekou-pipeline export --corte 2026-11
```

`export-contracts` escribe el detalle de los contratos (TASK-12) para la API: los 6,8 M de contratos del mapa municipal, repartidos en 16.384 archivos en `data/contratos/<corte>/`. Con `--pack` los empaqueta además en cuatro `contratos-<n>.tar.gz` dentro de la carpeta de publicación, para el Release. Con el corte 2026-11 tarda unos 3 minutos y pesa 7,9 GB (1,2 GB empaquetado). El corte mensual todavía no lo ejecuta: ver [CI/CD](../docs/ci-cd.md#detalle-de-los-contratos-task-12-pendiente-de-activar).

```bash
uv run ekou-pipeline export-contracts --corte 2026-11 --pack
```

## Ejecución mensual

El workflow [`corte-mensual`](../.github/workflows/corte-mensual.yml) corre el día 1 de cada mes a las 11:17 UTC en GitHub Actions: `extract` → `transform` → `compuertas` → `export` → publicación.

**Qué se publica**

| Destino | Contenido |
|---|---|
| Release `corte-AAAA-MM` | Todos los archivos de `export` y el reporte de extracción: el histórico |
| Worker `ekou-elephants-datos`: `datos/AAAA-MM/` | Los JSON del Release del corte vigente y del anterior, con el mismo nombre (menos `reporte-extraccion.json`): lo que consume la app |
| Worker `ekou-elephants-datos`: `datos/latest.json` | Puntero al corte vigente y a sus archivos |

El Worker de datos ([`worker-datos/wrangler.jsonc`](worker-datos/wrangler.jsonc)) solo tiene archivos estáticos y no tiene URL pública: la API lo lee por el binding `DATOS` ([CI/CD](../docs/ci-cd.md#datos-del-corte-mensual)). No se usa R2 porque exige tarjeta de crédito.

Cada despliegue de un Worker reemplaza todos sus archivos. Por eso el job `datos` arma la carpeta completa desde los Releases (el corte vigente y el anterior, para que una petición que leyó el `latest.json` previo encuentre todavía sus archivos) y la despliega con `wrangler deploy`. Reprocesar un mes más viejo que esos dos solo actualiza su Release: no se despliega ni mueve `latest.json` hacia atrás. Reprocesar el vigente reemplaza sus archivos en las mismas rutas; como el Worker no es público, ningún navegador ni CDN guarda esas rutas, y la caché hacia los usuarios la decide la API.

**Operación**

- **Reintentar o reprocesar un mes:** Actions → *corte-mensual* → *Run workflow*, con el corte `AAAA-MM` (vacío = mes actual), o `npm run datos:corte -- AAAA-MM`. Lo ya extraído se guarda en la caché de Actions, **cifrado** con `EKOU_PSEUDONYM_KEY` porque trae cédulas en claro y en un repositorio público un PR desde un fork puede leer las cachés. Así un reintento solo baja las particiones que faltan. Si el Release ya existe, se reemplazan sus archivos.
- **Aprobación:** el job `datos` usa el environment `production`, porque ahí están las credenciales de Cloudflare. Cada publicación en el Worker espera la aprobación de uno de sus revisores; el Release se publica antes, sin aprobación.
- **Si falla** la extracción, una prueba de datos o una compuerta: no se publica nada y se mantiene el corte anterior. Si falla el despliegue del Worker, el Release ya quedó publicado y la app sigue con el corte anterior. La tabla de compuertas queda en el resumen de la ejecución y, si la ejecución era programada, se abre (o se comenta) un issue `Falló el corte mensual AAAA-MM` con el enlace. Los logs de dbt y el reporte de extracción quedan como artefacto durante 90 días.
- Solo se publica desde `main`; desde otra rama la ejecución sirve de ensayo.

**Secretos**

| Secreto | Dónde | Uso |
|---|---|---|
| `EKOU_PSEUDONYM_KEY` | Repositorio | Obligatorio. Clave para seudonimizar las cédulas |
| `EKOU_SOCRATA_APP_TOKEN` | Repositorio | Recomendado. Sin él la API de datos.gov.co aplica límites más estrictos |
| `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` | Environment `production` (ya existen, [CI/CD](../docs/ci-cd.md)) | Desplegar el Worker de datos. Si falta alguno, el job `datos` falla y lo explica; el Release ya quedó publicado |

Después del primer despliegue del Worker de datos, activa la variable `DATOS_CORTE_ENABLED=true` para que la app se despliegue con el binding.

Varios datasets de SECOP se reconstruyen completos a diario en origen (SECOP II Contratos hacia las 02:43, hora de Colombia). Si eso ocurre en medio de una partición, el pipeline lo detecta con la cabecera `X-SODA2-Truth-Last-Modified` y vuelve a extraer la partición completa, para no mezclar dos versiones del dataset.

## Configuración

Variables de entorno (o archivo `.env`):

| Variable | Por defecto | Descripción |
|---|---|---|
| `EKOU_SOCRATA_APP_TOKEN` | — | [App Token](https://dev.socrata.com/docs/app-tokens) de datos.gov.co. Recomendado: sin él, la API aplica límites más estrictos. |
| `EKOU_DATA_DIR` | `data` | Raíz de las capas de datos |
| `EKOU_MAX_WORKERS` | `8` | Particiones que se extraen en paralelo |
| `EKOU_PAGE_SIZE` | `20000` | Filas por página. Páginas más grandes tardan más y el servidor llegó a cortarlas a mitad |
| `EKOU_REQUEST_TIMEOUT_S` | `120` | Espera máxima de cada lectura de red |
| `EKOU_MAX_REQUEST_S` | `300` | Duración máxima total de una petición; si se supera, se reintenta |
| `EKOU_DUCKDB_MEMORY` | `6GB` | Memoria máxima de DuckDB en `transform`. Lo que no cabe se escribe en `data/ekou.duckdb.tmp` |
| `EKOU_DUCKDB_TEMP` | `20GiB` | Espacio máximo de esos temporales, compartido por toda la base. Por eso dbt construye un modelo a la vez (`threads: 1` en [`profiles.yml`](transform/profiles.yml)): en paralelo, dos modelos grandes agotaron los 20 GiB |
| `EKOU_MAX_RETRIES` | `6` | Reintentos ante errores transitorios: 429 (respeta `Retry-After`), 5xx, fallas de red, JSON truncado y peticiones demasiado lentas |

## Desarrollo

```bash
uv run ruff format .     # formato
uv run ruff check .      # lint
uv run mypy src tests    # tipos (estricto)
uv run pytest            # pruebas, con cobertura mínima del 80 %
```

El CI ejecuta las mismas comprobaciones en cada pull request.

## Estructura

```
src/ekou_pipeline/
├── catalog.py     # fuentes: dataset, columnas y columna de partición
├── socrata.py     # cliente de la API: paginación keyset, reintentos y detección de reemplazos
├── bronze.py      # extracción paralela por partición, reanudable, a Parquet
├── config.py      # configuración validada (pydantic-settings)
├── log_config.py  # logs estructurados en JSON
├── transform.py   # ejecuta dbt para un corte
├── compuertas.py  # compuertas de calidad del corte antes de publicar
├── publish.py     # exporta el corte a Parquet, CSV y JSON para publicarlo
├── contracts.py   # exporta el detalle de los contratos en grupos para la API (TASK-12)
├── seudonimo.py   # HMAC-SHA256 de los documentos de personas naturales
├── dbt_plugin.py  # expone ekou_seudonimo() dentro de DuckDB
└── cli.py         # comando ekou-pipeline

transform/                 # proyecto dbt
├── models/staging/        # tipos de dato y una fila por llave de negocio
├── models/intermediate/   # ubicación, cruces y reglas por fuente
├── models/silver/         # contratos: SECOP I y II con las mismas columnas
├── models/gold/           # mapa_municipios y calidad_corte
├── tests/                 # pruebas de datos del corte
└── seeds/                 # alias de municipios y departamentos, SMMLV
```

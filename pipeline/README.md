# ekou-pipeline

Pipeline de datos abiertos de EKOU-Elephants. Extrae cada mes la contratación pública de Colombia (SECOP I y SECOP II) desde [datos.gov.co](https://www.datos.gov.co), a escala nacional, y la convierte en tablas consultables para el mapa.

```
datos.gov.co ──extract──▶ bronze (Parquet, tal como llega) ──transform (dbt + DuckDB)──▶ silver: contratos ──▶ gold: mapa_municipios, calidad_corte
```

Los resultados del corte 2026-11 (volúmenes, tiempos, calidad y limitaciones) están en [resultados de la POC](../docs/resultados-poc.md).

Las decisiones de diseño, alternativas y mediciones están en el [ADR 0001](../docs/adr/0001-ingesta-de-datos.md). La evidencia sobre la calidad de cada fuente y las reglas de limpieza están en la [investigación de ingesta](../docs/investigacion-ingesta.md). Las fuentes están descritas en [fuentes de datos](../docs/fuentes-de-datos.md).

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

Si la ejecución se interrumpe, al volver a lanzarla **solo se extraen las particiones que faltan**. Si cambian las columnas de una fuente en el catálogo, sus particiones se vuelven a extraer.

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
| `EKOU_DUCKDB_TEMP` | `20GiB` | Espacio máximo de esos temporales |
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

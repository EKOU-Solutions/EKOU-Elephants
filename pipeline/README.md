# ekou-pipeline

Pipeline de datos abiertos de EKOU-Elephants. Extrae cada mes la contratación pública de Colombia (SECOP II), el presupuesto territorial (CUIPO) y el registro empresarial (RUES) desde [datos.gov.co](https://www.datos.gov.co), a escala nacional.

Las decisiones de diseño, alternativas y mediciones están en el [ADR 0001](../docs/adr/0001-ingesta-de-datos.md). Las fuentes están descritas en [fuentes de datos](../docs/fuentes-de-datos.md).

## Requisitos

- Python 3.12+
- [uv](https://docs.astral.sh/uv/)

## Uso

```bash
cd pipeline
uv sync

# Extrae SECOP II Contratos y DIVIPOLA a la capa bronze, para el corte 2026-11
uv run ekou-pipeline extract secop_contratos divipola --corte 2026-11
```

Los datos quedan en `data/bronze/corte=2026-11/fuente=<fuente>/particion=<año>/`. Al terminar, el comando imprime un reporte JSON con filas extraídas, filas esperadas y tiempos por partición.

Si la ejecución se interrumpe, al volver a lanzarla **solo se extraen las particiones que faltan**.

## Configuración

Variables de entorno (o archivo `.env`):

| Variable | Por defecto | Descripción |
|---|---|---|
| `EKOU_SOCRATA_APP_TOKEN` | — | [App Token](https://dev.socrata.com/docs/app-tokens) de datos.gov.co. Recomendado: sin él, la API aplica límites más estrictos. |
| `EKOU_DATA_DIR` | `data` | Raíz de las capas de datos |
| `EKOU_MAX_WORKERS` | `8` | Particiones que se extraen en paralelo |
| `EKOU_PAGE_SIZE` | `50000` | Filas por página |
| `EKOU_MAX_RETRIES` | `6` | Reintentos ante errores transitorios (429, 5xx, tiempos agotados) |

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
├── socrata.py     # cliente de la API: paginación keyset y reintentos
├── bronze.py      # extracción paralela por partición, reanudable, a Parquet
├── config.py      # configuración validada (pydantic-settings)
├── log_config.py  # logs estructurados en JSON
└── cli.py         # comando ekou-pipeline
```

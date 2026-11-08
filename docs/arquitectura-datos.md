# Arquitectura de datos

> Cómo viajan los datos desde datos.gov.co hasta el mapa. Decisiones y alternativas: [ADR 0002](adr/0002-ingesta-de-datos.md) · Evidencia: [investigación de ingesta](investigacion-ingesta.md) · Fuentes: [fuentes de datos](fuentes-de-datos.md)

## En 30 segundos

Cada mes, un workflow de GitHub Actions descarga la contratación pública de Colombia, la limpia y la publica como archivos estáticos. La app en Vercel solo lee esos archivos: **no depende de datos.gov.co ni de un servidor propio** para mostrar el mapa.

```mermaid
flowchart LR
    SRC["🏛️ datos.gov.co<br/>SECOP I · SECOP II · DANE<br/>~28 M filas"]
    PIPE["⚙️ Pipeline mensual<br/>GitHub Actions<br/>Python · DuckDB · dbt"]
    PUB["📦 Corte publicado<br/>Parquet · GeoJSON · CSV<br/>+ reporte de calidad"]
    APP["🗺️ App EKOU<br/>Vercel"]
    CIU["👥 Ciudadanía"]

    SRC -->|"API SODA<br/>keyset paralelo"| PIPE
    PIPE -->|"solo si pasa las<br/>compuertas de calidad"| PUB
    PUB -->|"CDN"| APP
    APP --> CIU
    PUB -.->|"descarga libre<br/>CC BY-SA 4.0"| CIU
```

## Capas de datos (medallón)

Cada capa tiene una responsabilidad y una regla de publicación distinta.

```mermaid
flowchart LR
    subgraph ORIGEN["Origen · datos.gov.co"]
        direction TB
        S2C["SECOP II Contratos<br/>jbjy-vk9h · 5,7 M"]
        S2P["SECOP II Procesos<br/>p6dx-8zbt · 9,4 M"]
        S2U["SECOP II Ubicaciones<br/>gra4-pcp2 · 6,5 M"]
        S1["SECOP I<br/>f789-7hwg · 6,5 M"]
        DV["DIVIPOLA<br/>gdxc-w37w · 1.122"]
    end

    subgraph BRONZE["🥉 Bronze · privado"]
        direction TB
        B["Parquet tal como llega<br/>todo como texto<br/>particionado por corte, fuente y año"]
    end

    subgraph SILVER["🥈 Silver · público"]
        direction TB
        ST["staging<br/>tipos de dato · deduplicación"]
        INT["intermediate<br/>diccionarios DANE · ubicación<br/>valor inicial del proceso"]
        CT["contratos<br/>1 fila por contrato<br/>reglas S01-S14 · seudónimos HMAC"]
        ST --> INT --> CT
    end

    subgraph GOLD["🥇 Gold · público"]
        direction TB
        MAP["mapa_municipios<br/>indicadores por municipio y año"]
        CAL["calidad_corte<br/>qué se pudo usar y qué no"]
    end

    ORIGEN -->|"extract"| BRONZE
    BRONZE -->|"transform<br/>dbt build"| SILVER
    CT --> MAP
    CT --> CAL
```

| Capa | Qué contiene | Quién la ve | Herramienta | Se garantiza que… |
|---|---|---|---|---|
| **Bronze** | Los datos tal como llegan, sin columnas bancarias ni de domicilio | **Nadie: nunca se publica** | Python + PyArrow | Cada partición cuadra con el `count(*)` del origen |
| **Silver** | Un contrato por fila, tipado, deduplicado, con municipio de ejecución y alertas | Público | dbt + DuckDB | Ninguna persona natural queda identificada; no se pierde ningún contrato |
| **Gold** | Agregados listos para el mapa y el reporte de calidad | Público | dbt + DuckDB | Las sumas excluyen valores atípicos y solo usan ubicaciones confiables |

## El corte mensual, paso a paso

```mermaid
sequenceDiagram
    autonumber
    participant GH as GitHub Actions
    participant API as datos.gov.co
    participant BR as Bronze
    participant DBT as dbt + DuckDB
    participant QA as Compuertas
    participant PUB as Releases / Vercel Blob
    participant APP as App (Vercel)

    GH->>API: metadatos y count(*) por partición
    API-->>GH: esquema, filas esperadas, huella de versión
    Note over GH: ¿Cambió el esquema? ¿Hay vistas vacías?<br/>Si sí, se detiene
    par 8 conexiones en paralelo
        GH->>API: páginas de 20.000 filas (keyset por :id)
        API-->>BR: Parquet por partición + _SUCCESS.json
    end
    Note over GH,API: Si el dataset se reconstruye a mitad,<br/>la partición se rehace completa
    GH->>DBT: transform --corte AAAA-MM
    DBT->>DBT: silver → pruebas → gold → pruebas
    DBT->>QA: reporte de calidad
    alt el corte pasa las compuertas
        QA->>PUB: publicar /datos/AAAA-MM/ y latest.json
        PUB-->>APP: el mapa lee el corte nuevo desde el CDN
    else falla alguna compuerta
        QA->>GH: abrir issue con el error
        Note over APP: sigue mostrando el corte anterior
    end
```

## Dónde se ejecuta un contrato

La ciudad de SECOP es la sede de la entidad, no el lugar de la obra. La ubicación se asigna en cascada y cada contrato guarda su nivel de confianza.

```mermaid
flowchart TD
    C["Contrato"] --> U{"¿SECOP declara<br/>ubicación de ejecución?"}
    U -->|"1 municipio"| A{"¿Es igual a<br/>la sede?"}
    U -->|"varios municipios"| D["🟠 departamental<br/>solo en el mapa por departamento"]
    U -->|"no"| S{"¿La entidad<br/>es una alcaldía?"}
    A -->|"no"| MA["🟢 media_alta<br/>se ejecuta en otro municipio"]
    A -->|"sí, y es alcaldía"| AL["🟢 alta"]
    A -->|"sí, entidad nacional<br/>o departamental"| B["🔴 baja<br/>puede ser un valor por defecto"]
    A -->|"sí, otra entidad"| M["🟡 media"]
    S -->|"sí"| M2["🟡 media<br/>sede de la alcaldía"]
    S -->|"no"| N["⚪ ninguna<br/>no se territorializa"]

    AL & MA & M & M2 --> MAPA["Mapa municipal"]
```

Próximos niveles: el municipio del proyecto de inversión (BPIN, DNP) y el nivel de la entidad desde CHIP.

## Dónde vive cada cosa

```mermaid
flowchart TB
    subgraph REPO["Repositorio EKOU-Elephants"]
        direction LR
        subgraph PY["pipeline/src/ekou_pipeline"]
            CAT["catalog.py<br/>fuentes y columnas"]
            SOC["socrata.py<br/>cliente de la API"]
            BRZ["bronze.py<br/>extracción paralela"]
            TRF["transform.py<br/>ejecuta dbt"]
            PSE["seudonimo.py<br/>HMAC-SHA256"]
        end
        subgraph DBTP["pipeline/transform"]
            MOD["models/<br/>staging · intermediate<br/>silver · gold"]
            SEED["seeds/<br/>alias DANE · SMMLV"]
            MAC["macros/<br/>reglas S01-S14"]
            TST["tests/<br/>sin datos personales<br/>sin pérdida de filas"]
        end
        subgraph CI[".github"]
            WF["pipeline-ci.yml<br/>ruff · mypy · pytest"]
            DEP["dependabot.yml"]
        end
    end
    SECRETS[("GitHub Secrets<br/>EKOU_SOCRATA_APP_TOKEN<br/>EKOU_PSEUDONYM_KEY")]
    SECRETS -.-> PY
```

## Estado

| Componente | Estado |
|---|---|
| Extracción a bronze (SECOP II Contratos, nacional) | ✅ 5.687.362 filas, 13 de 13 particiones idénticas al origen |
| Extracción de SECOP I, Procesos y Ubicaciones | 🔧 En catálogo, primera ejecución nacional pendiente |
| Silver y gold con dbt | 🔧 Modelos y pruebas escritos, primera ejecución pendiente |
| Workflow mensual en GitHub Actions | ⏳ Pendiente (necesita los secretos) |
| Publicación en GitHub Releases y Vercel Blob | ⏳ Pendiente |
| Ubicación por BPIN (DNP) y nivel de entidad por CHIP | ⏳ Fase siguiente |
| Buscador (PostgreSQL) | ⏳ Fase posterior |

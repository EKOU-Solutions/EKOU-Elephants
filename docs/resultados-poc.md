# Resultados de la POC de ingesta (corte 2026-11)

> Tarea: [TASK-06 · Ingesta de datos (#7)](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/7) · Decisión: [ADR 0001](adr/0001-ingesta-de-datos.md) · Reglas de limpieza: [investigación de ingesta](investigacion-ingesta.md) · Cómo correrlo: [pipeline/README.md](../pipeline/README.md)
>
> Ejecutado el **7 de noviembre de 2026** sobre el universo nacional completo, en un portátil con Windows 11, 32 GB de RAM y sin App Token de datos.gov.co.

## En 1 minuto

- **Se extrajeron 28.079.684 filas de 5 fuentes**, todas iguales al `count(*)` del origen, sin un solo reintento, en unas 2 horas.
- **dbt construyó silver y gold en 9 a 10 minutos** y pasaron sus 45 pasos: modelos y pruebas de datos.
- **El resultado es consultable:** 11,4 M de contratos en una sola tabla (`contratos`) y una tabla por municipio y año para el mapa (`mapa_municipios`), que cubre 1.106 de los 1.122 municipios.
- **El corte real encontró errores de origen que las muestras no mostraban:** contratos de $39.251 billones, duraciones de 915 millones de días y fechas de firma en 2099. Cada uno quedó con una regla y una prueba. Sin ellas, el mapa habría sumado $21.962 billones en vez de $1.033.
- **Para producción falta**, sobre todo, el App Token, publicar los archivos del corte y fijar los umbrales de las compuertas de calidad (ver [qué falta](#5-qué-falta-para-producción)).

## 1. Fuentes, campos, periodo y tamaño

No se usó una muestra: la POC corrió sobre **todo el histórico nacional**, porque el volumen es justamente lo que hay que validar.

| Fuente | Dataset | Columnas extraídas | Periodo (fecha de firma) | Filas en origen | Filas útiles tras deduplicar |
|---|---|---|---|---|---|
| SECOP II – Contratos | `jbjy-vk9h` | 32 | 2015-06 a 2026-11 | 5.687.362 | 5.687.090 contratos |
| SECOP II – Procesos | `p6dx-8zbt` | 29 | — | 9.446.763 | 8.760.878 portafolios |
| SECOP II – Ubicaciones de ejecución | `gra4-pcp2` | 6 | — | 6.463.892 | 6.441.050 pares contrato–municipio |
| SECOP I – Procesos de compra | `f789-7hwg` | 35 | 2000 a 2026 | 6.480.545 | 5.729.913 contratos firmados |
| DANE – DIVIPOLA | `gdxc-w37w` | 7 | — | 1.122 | 1.122 municipios |

Las columnas exactas de cada fuente están en [`catalog.py`](../pipeline/src/ekou_pipeline/catalog.py). Las cuentas bancarias, los domicilios y los datos de representantes legales, supervisores y ordenadores del gasto se excluyen desde la extracción.

## 2. Flujo: de la fuente a una salida consultable

```
datos.gov.co ──extract──▶ bronze ──transform (dbt + DuckDB)──▶ silver ──▶ gold
```

| Capa | Qué contiene | Formato |
|---|---|---|
| **bronze** | Los datos tal como llegan, todo como texto, particionados por corte, fuente y año | Parquet, 2,9 GB |
| **silver** | `contratos`: SECOP I y II con las mismas 51 columnas, tipos de dato, municipio de ejecución, alertas de valor y seudónimos | DuckDB |
| **gold** | `mapa_municipios` (indicadores por municipio y año) y `calidad_corte` (qué se pudo usar y qué no) | DuckDB |

El diagrama completo está en [arquitectura](arquitectura.md).

**Tiempos medidos**

| Paso | Tiempo |
|---|---|
| SECOP II – Contratos | 62 min |
| SECOP II – Procesos | 39 min |
| SECOP I | 11 min |
| SECOP II – Ubicaciones | 9 min |
| DIVIPOLA | 1 s |
| **Extracción total** (fuentes en paralelo) | **~2 h** |
| **Transformación y pruebas** | **9 a 10 min** |

El cuello de botella es la API: sin App Token, una conexión trae ~1.000 filas por segundo.

## 3. Calidad y relaciones para el mapa

Cifras de la tabla `calidad_corte`.

| Indicador | SECOP I | SECOP II |
|---|---|---|
| Contratos | 5.729.913 | 5.687.090 |
| Duplicados en origen (se conserva una fila) | 111.130 | 272 |
| **Ubicados en un municipio del mapa** | **88,3 %** | **84,3 %** |
| — confianza alta | 0 % | 19,8 % |
| — confianza media-alta | 0 % | 25,5 % |
| — confianza media | 88,3 % | 39,0 % |
| Solo se sabe el departamento | 0 % | 0,9 % |
| Ubicación de baja confianza (no entra al mapa) | 0,2 % | 9,3 % |
| **Sin ubicación (no vinculables)** | **11,5 %** | **5,6 %** |
| Sede de la entidad sin vincular a DIVIPOLA | 1,9 % | 21,3 % |
| Con valor inicial | 99,5 % | 87,9 % |
| Pago reportado | 0 % (no existe el campo) | 50,7 % |
| Alertas de valor: error de magnitud (fuera de las sumas) | 156 | 1.012 |
| Alertas de valor: revisar magnitud (fuera de las sumas) | 75 | 42 |
| Superan el tope de mínima cuantía (se marcan, sí suman) | 240 | 114 |
| Contratista sin documento | 500 | 16.671 |
| Fecha de firma posterior al corte | 24 | 0 |

**Llaves de cruce**

| Cruce | Llave | Resultado |
|---|---|---|
| Contrato SECOP II → proceso | `proceso_de_compra` = `id_del_portafolio` | Sin pérdidas: la prueba `filas_no_se_pierden` exige que todo contrato de staging llegue a silver |
| Contrato SECOP II → municipio de ejecución | `id_contrato` en Ubicaciones | Cubre el 84,3 % con confianza media o mejor |
| Contrato SECOP I → municipio | Nombre del municipio + departamento de la entidad, normalizados contra DIVIPOLA y alias | Cubre el 88,3 %, siempre con confianza media porque el dato es un nombre, no un código |
| Municipio → DIVIPOLA | Código DANE de 5 dígitos | La prueba `relationships` exige que todo código exista en DIVIPOLA |
| Contratista SECOP I ↔ SECOP II | Seudónimo HMAC del documento | La misma persona tiene el mismo seudónimo en las dos fuentes |

**Lo que llega al mapa** (`mapa_municipios`)

| Indicador | Valor |
|---|---|
| Filas (municipio × año de firma) | 11.175 |
| Municipios con al menos un contrato | 1.106 de 1.122 |
| Años | 2000 a 2026 |
| Contratos | 9.843.269 |
| Valor contratado que se suma | $1.033 billones (entre $89 y $167 billones por año desde 2019) |
| Contratos que se cuentan pero cuyo valor no se suma | 874 |

Solo entran contratos con ubicación de confianza media o mejor, que no estén cancelados y que no tengan fecha de firma posterior al corte.

**Pruebas de datos que corren en cada corte:** unicidad de cada llave, valores aceptados en cada categoría, integridad referencial con DIVIPOLA, que no se pierdan contratos entre capas y que no quede ninguna cédula en claro (`sin_datos_personales_en_claro`).

## 4. Errores de origen encontrados y cómo se tratan

Regla general: **un dato malo se marca y se excluye de las sumas, nunca se borra**, para que cualquiera pueda verificarlo contra SECOP.

| Hallazgo | Casos | Tratamiento |
|---|---|---|
| Valores multiplicados por 10⁸ (un contrato de $64 M aparece por $6,45 × 10¹⁵) | 1.161 | `alerta_valor = 'error_magnitud'`, fuera de las sumas del mapa y con `valor_corregido_propuesto` cuando es posible |
| Valores imposibles que el proceso de origen repite (hasta $39.251 billones, más de 20 veces el PIB) | 7 | Techo de $50 billones por contrato: `error_magnitud`. Solo estos 7 sumaban $61.177 billones |
| "Mínimas cuantías" de más de 10 veces su tope legal (una de $25 billones con objeto "PRUEBA") | 112 | `revisar_magnitud`: fuera de las sumas, porque no se sabe si está mal el valor o la modalidad |
| Duraciones imposibles en SECOP II Procesos (hasta 915 M de días o 333 M de meses) | 326 procesos | Duraciones de más de 100 años dejan `fecha_fin_original` vacía. Antes de la regla, tumbaban todo el corte |
| Fechas de firma futuras en SECOP I (años 2075 a 2099; por ejemplo, firma en 2096 y cargue en SECOP en 2021) | 24 | Quedan en silver con la fecha de origen, se cuentan en `calidad_corte` y no entran al mapa |
| Filas repetidas en origen | 111.402 | Se conserva la versión más reciente por llave de negocio |
| `valor_pagado = 0` significa "no reportado", no "no pagado" | 49 % de los contratos de SECOP II no reportan pago | Se publica siempre con su cobertura (`pago_reportado`) |

## 5. Qué falta para producción

**Limitaciones observadas**

- **Velocidad de la API sin App Token:** ~1.000 filas por segundo por conexión. Las particiones grandes (1 a 1,9 M de filas) marcan el tiempo total.
- **Recursos de la máquina:** la transformación necesita ~6 GB de memoria y hasta 20 GB de disco temporal. En un runner estándar de GitHub Actions (16 GB de RAM y ~14 GB de disco libre) hay que bajar `EKOU_DUCKDB_TEMP` o usar un runner más grande.
- **SECOP I no tiene ubicación de alta confianza:** solo trae el nombre del municipio, así que el mapa mezcla la ubicación exacta de SECOP II con la aproximada de SECOP I. El campo `participacion_confianza_alta` lo deja visible.
- **El 21,3 % de las sedes de SECOP II no se vinculan a DIVIPOLA:** no afecta el mapa, que usa el lugar de ejecución, pero sí los análisis por entidad. Faltan alias de nombres de ciudades.
- **Las reglas de normalización de nombres** (alias de municipios y departamentos) se mantienen a mano mientras SECOP no publique el código DANE.

**Lo que falta construir**

| # | Pendiente | Por qué |
|---|---|---|
| 1 | Registrar el App Token como secreto `EKOU_SOCRATA_APP_TOKEN` | Quitar el límite de velocidad de la API |
| 2 | Workflow mensual en GitHub Actions: extract → transform → publicación | Hoy se corre a mano |
| 3 | Publicar gold como archivos (GeoJSON, Parquet y CSV con `datapackage.json`) | La app y las comunidades consumen archivos, no la base DuckDB |
| 4 | Fijar los umbrales de las compuertas de calidad (por ejemplo, % mínimo de contratos ubicados) y comparar contra el corte anterior | Hoy el corte se detiene si falla una prueba, pero no si la cobertura cae |
| 5 | Agregar el Marco Geoestadístico Nacional (MGN) del DANE | Polígonos de los municipios para dibujar el mapa |
| 6 | Proponer una fecha de firma corregida para las fechas futuras, con el año del `uid` y la fecha de cargue en SECOP | Hoy esos 24 contratos quedan fuera del mapa; casi siempre el año real se puede recuperar sin reemplazar el dato de origen |
| 7 | Ampliar los alias de ciudades de las sedes | Bajar el 21,3 % de sedes sin vincular |
| 8 | Validar las reglas con TASK-07 (#8, alertas) y TASK-08 (#9, datos personales) | Las reglas de silver alimentan esas tareas |

## 6. Cómo reproducirlo

Las instrucciones completas están en [pipeline/README.md](../pipeline/README.md). En resumen:

```bash
cd pipeline
uv sync
export EKOU_PSEUDONYM_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
uv run ekou-pipeline extract secop_contratos secop_procesos secop_ubicaciones secop_i divipola --corte 2026-11
uv run ekou-pipeline transform --corte 2026-11
```

Para revisar el código sin descargar 28 M de filas, basta con `uv run pytest`: la prueba de integración construye silver y gold sobre un bronze de ejemplo con los casos difíciles reales (obra ejecutada fuera de la sede, valor ×10⁸, valor imposible que el proceso repite, duración imposible, fecha de firma en 2099, fila repetida en origen y cédula que se seudonimiza).

# Investigación de ingesta: qué tan confiables son los datos y cómo tratarlos

> Tarea: [TASK-06 · Ingesta de datos (#7)](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/7) · Decisión: [ADR 0002](adr/0002-ingesta-de-datos.md) · Fuentes: [fuentes de datos](fuentes-de-datos.md)
>
> Medido contra la API de datos.gov.co el **7 de noviembre de 2026**. Las cifras cambian con cada corte; las reglas se derivan de ellas y se revisan en cada corte con el reporte de calidad.

## En 1 minuto

Los datos públicos de contratación sirven para EKOU, pero **ninguno se puede publicar tal como llega**. Estos son los hallazgos que cambian el diseño:

| # | Hallazgo | Consecuencia |
|---|---|---|
| 1 | **SECOP II no cubre a todos los municipios.** En 2025, solo 744 de 1.104 alcaldías contratan en SECOP II; 278 contratan **solo** en SECOP I. | El primer corte incluye **SECOP I**. Sin él, el mapa mostraría vacías justo las regiones con más riesgo. |
| 2 | **La ciudad de SECOP es la sede de la entidad, no el lugar de la obra.** El 58 % de las obras de gobernaciones y el 48 % de las de entidades nacionales se ejecutan en otro municipio. | El municipio sale de **SECOP II – Ubicaciones de ejecución** (`gra4-pcp2`), con una cascada de 8 niveles y un nivel de confianza por contrato. |
| 3 | **Hay valores absurdos de origen.** Un contrato de mínima cuantía de $64 millones aparece por $6,45 × 10¹⁵ (×10⁸). | Regla de atípicos por magnitud: se marcan y se excluyen de las sumas, sin borrarlos. |
| 4 | **La llave contrato ↔ proceso no es la obvia.** `proceso_de_compra` cruza con `id_del_portafolio`, no con `id_del_proceso` (0 de 54 coincidencias). | Sin esto, las alertas de sobrecosto y de oferente único saldrían vacías. |
| 5 | **SECOP II Contratos se reconstruye completo cada día** (~02:43 hora de Colombia) y cambian todos sus `:id`. | El extractor detecta el reemplazo y rehace la partición. Las llaves de silver son de negocio, nunca `:id`. |
| 6 | **Hay vistas que quedaron vacías sin dar error** (SECOP II Ofertas 2022 y 2023 devuelven 0 filas). | Compuerta de calidad: una partición no puede caer a 0 ni encogerse de forma anómala frente al corte anterior. |
| 7 | **`valor_pagado = 0` significa "no reportado", no "no pagado"** (32 % de las obras terminadas de 2025). | Se publica siempre con su cobertura. |
| 8 | **1,79 M de contratos traen números de cuenta bancaria** y 2,08 M traen domicilios. | Se excluyen desde la extracción; las cédulas de personas naturales se seudonimizan con HMAC. |

## Cómo se investigó

Cinco frentes en paralelo, con consultas livianas (agregaciones filtradas y muestras de 300 a 3.000 contratos) y límite de tiempo por consulta. Cada cifra indica su universo.

| Frente | Pregunta |
|---|---|
| [Estabilidad de la API](#1-estabilidad-de-la-api) | ¿La paginación es confiable? ¿Qué cambia en origen y cómo detectarlo? |
| [Semántica de campos](#2-semántica-de-los-campos) | ¿Qué significa cada valor y cuánto se puede confiar en él? |
| [Geolocalización](#3-dónde-se-ejecuta-cada-contrato) | ¿En qué municipio se ejecuta cada contrato? |
| [Cobertura](#4-cobertura-qué-falta-en-los-datos) | ¿Qué no está en los datos y cuándo están completos? |
| [Datos personales y licencias](#5-datos-personales-y-licencias) | ¿Qué se puede publicar y bajo qué condiciones? |

---

## 1. Estabilidad de la API

**Paginación keyset sobre `:id`.** Es la práctica que recomienda Socrata. Validada a escala nacional: 12 de 13 particiones de SECOP II Contratos cuadraron **exactamente** con `count(*)` (4.851.900 filas), sin pérdidas ni duplicados.

| Hallazgo | Evidencia | Medida en el extractor |
|---|---|---|
| `:id` sigue el orden de inserción y **cambia en cada reemplazo** del dataset | jbjy-vk9h: las 5,69 M filas tienen el mismo `:created_at` (07:43 UTC de ese día). p6dx-8zbt igual (18:15 UTC). Ningún dataset declara `rowIdentifier`. | Huella `X-SODA2-Truth-Last-Modified` por página; si cambia, la partición se rehace. Correr lejos de esas horas. |
| Páginas de 50.000 filas tardan ~52 s y el servidor llegó a cortarlas con HTTP 200 | Partición 2023: JSON truncado a mitad de una página de 67 MB | Páginas de 20.000 filas, validación del JSON y reintento desde el mismo cursor |
| El timeout de red aplica por lectura, no por petición | Una respuesta lenta puede mantener viva una página indefinidamente | Tiempo máximo total por petición (300 s) |
| Con App Token, Socrata no limita el uso; sin él, el límite es por IP y no se publica | dev.socrata.com/docs/app-tokens | Token como secreto `EKOU_SOCRATA_APP_TOKEN`; 429 respeta `Retry-After`; 403 por token inválido es error fatal |
| **El endpoint SODA1 `/api/views/{id}/rows.csv` se apaga el 16-22 de diciembre de 2026** | Cabeceras `Deprecation` y `Sunset` de la respuesta | No se usa. El respaldo es SODA3 `/api/v3/views/{id}/export.csv` (5 a 7 veces más rápido por conexión) |
| SODA2 `/resource` (el que usamos) no tiene fecha de retiro | Socrata, "Using SODA3 API" (nov. 2026) | Riesgo bajo; el cliente queda aislado en `socrata.py` para migrar a SODA3 |
| **Vistas filtradas que quedaron vacías** | vz4x-85r3 (Ofertas 2023) y yk6j-79e6 (2022) devuelven 0 filas desde la reorganización de oct. 2026. Las reemplazan bpan-xvj3 (≤2022), b28v-edj8 (2023-2024) y wi7w-2nvm (2025-2026), ~96,6 M filas | Compuerta: 0 filas o caída >1 % frente al corte anterior detiene la publicación |
| `:created_at` no sirve para cargas incrementales en SECOP | Todas las filas parecen nuevas cada día | Recarga completa mensual (ADR, decisión 5.1) |

**Contrato de esquema por dataset y corte.** Se guardan `tableId`, `modifyingViewUid`, `displayType`, `rowsUpdatedAt`, `viewLastModified`, la lista de columnas con su tipo y su hash, y el `count(*)` por partición.

- **Detener** si desaparece una columna o cambia su tipo, si cambia `tableId`, si el dataset pasa a ser una vista filtrada, o si el conteo cae de forma anómala.
- **Avisar y continuar** si aparecen columnas nuevas.

## 2. Semántica de los campos

| Campo | Qué significa en realidad | Regla para silver |
|---|---|---|
| `valor_del_contrato` | Valor **actual, con adiciones**. No existe el valor de firma en SECOP II Contratos. Todo contrato que supera el adjudicado tiene una modificación registrada; el tope observado de ×1,5 coincide con el límite legal del 50 % (Ley 80, art. 40). | Renombrar a `valor_actual` |
| Valor inicial | Sale del proceso (p6dx-8zbt): `valor_total_adjudicacion` en modalidades competitivas (coincide en 96-98,5 % de los contratos sin modificaciones) y `precio_base` en contratación directa y régimen especial (87-97 %) | Solo si el portafolio tiene un contrato; si hay lotes (17 % en licitación), comparar la suma |
| `valor_pagado` | Se alimenta del módulo de facturas de SECOP II. Casi binario: 39 % en 0 y 49 % ≥98 % en obras terminadas desde 2022. Los campos `valor_pendiente_*` son derivados. | Bandera `pago_reportado`; 0 = "no reportado"; publicar la cobertura |
| `fecha_de_fin_del_contrato` | Fecha **vigente**: ya incluye prórrogas y suspensiones. `dias_adicionados` subregistra. | `fin_original = inicio + duración del proceso`; `retraso_dias = fin_actual − fin_original` |
| `estado_contrato` | "Modificado" es un estado documental, no de ejecución: el 83 % de las obras en ese estado ya pasó su fecha de fin. "En ejecución" también (75 %). | Derivar `estado_ejecucion` (antes de firma, sin iniciar, activo, vencido sin cierre, suspendido, terminado) |
| `liquidaci_n = Si` | Significa "requiere liquidación", no "ya liquidado" (aparece en 725 contratos aprobados sin iniciar) | No usar como liquidado |
| Adiciones (cb9c-h8sn) | No trae el monto. Las adiciones suelen registrarse como "Modificación General". **Las etiquetas "Suspensión" y "Reactivación" están invertidas** (91 % y 84 % de las descripciones dicen lo contrario). | Usar solo como evidencia de evento; suspensiones desde u99c-7mfm |
| Ejecución (mfmm-jqmq) | Solo ~8,5 % de las obras reporta avance. El porcentaje esperado es igual al real en el 77 % de las filas. | Avance = máximo real confirmado, tope 100; `sin_reporte_avance`; no usar el esperado |
| `id_contrato` | 5.687.362 filas, 5.687.090 distintos: **272 duplicados** idénticos en origen | Deduplicar por `id_contrato`, conservar la `ultima_actualizacion` más reciente |
| `justificacion_modalidad_de` | Desde enero de 2025 conviven valores en inglés (`Article30_1993`, `Law2166of2021_Article95_SolidarityAgreements`…) con los equivalentes en español | Tabla de correspondencia versionada (seed); `justificacion_no_mapeada` para valores nuevos |
| `orden` | Mal asignado: hay alcaldías marcadas como "Nacional" (Envigado, Magangué) | No usarlo; el nivel de la entidad sale de CHIP (5c7g-ptic) por NIT |

### Valores atípicos

El total absurdo de $6.454 billones en obras de mínima cuantía es **un solo contrato** (CO1.PCCNTR.5972834): su valor plausible es $64.538.400, multiplicado por 10⁸. En todo el dataset hay 46 contratos por encima de $10 billones. El patrón: `valor / precio_base` cae en 10⁶ a 10⁹, por decimales leídos como dígitos.

| Regla | Condición | Acción |
|---|---|---|
| A1 | `valor_actual / valor_inicial > 100` | `valor_invalido = error_magnitud`; se excluye de las sumas |
| A2 | La razón es cercana a 10ᵏ con k ≥ 2 (±2 %) | Proponer `valor_corregido = valor / 10ᵏ` en columna aparte, nunca reemplazar |
| A3 | Mínima cuantía por encima de 150 SMMLV del año de firma (100 SMMLV + 50 % de adición) | `supera_tope_minima_cuantia` (5 a 33 contratos por año) |
| A4 | Valor > $2 × 10¹² sin valor inicial que lo respalde | `revisar_magnitud` |
| A5 | En las métricas | Mediana y p99; sumas sin las filas marcadas, indicando cuántas se excluyeron |
| A6 | Valor > $50 billones, aunque el valor inicial coincida | `error_magnitud`. Ningún contrato público colombiano llega a esa cifra (el Metro de Bogotá ronda los $20 billones). En el corte 2026-11 son 7 contratos que sumaban $61.177 billones; su proceso trae el mismo error, por eso A1 y A4 no los detectaban |
| A7 | Mínima cuantía por encima de 1.500 SMMLV (10 veces el tope legal) | `revisar_magnitud`: el valor o la modalidad están mal y no se puede saber cuál, así que no entra a las sumas. En el corte 2026-11 son 112 contratos, entre ellos uno de $25 billones cuyo objeto es "PRUEBA" |

## 3. Dónde se ejecuta cada contrato

**La ciudad de SECOP no sirve como lugar de ejecución.** `departamento` y `ciudad` son la sede de la entidad (16 % "No Definido" en obras 2024-2025), y `direcci_n_de_ejecuci_n_del_contrato` coincide con la sede en el 96 % de los casos.

**La fuente correcta es `gra4-pcp2` (SECOP II – Ubicaciones de ejecución, 6,46 M filas).** Cubre el 100 % de una muestra de 3.000 obras; el 96,6 % tiene una sola ubicación.

| Tipo de entidad | Ubicación de ejecución = sede |
|---|---|
| Alcaldías | 99 % |
| Gobernaciones | 42 % |
| Entidades nacionales | 52 % |

Su debilidad: cuando una entidad nacional o departamental deja la sede como ubicación, puede ser un valor por defecto. Por eso se cruza con el municipio del proyecto de inversión (BPIN): `urlproceso` → DNP `uwns-mbwd` → `xikz-44ja` (localización con código DANE). El 37 % de las obras se vincula a un BPIN, y su municipio coincide con `gra4-pcp2` en el 79,5 % de los casos.

### Asignación en cascada

| Nivel | Regla | % estimado (obras 2024-2025) | Confianza |
|---|---|---|---|
| N1 | BPIN con un municipio que coincide con la ubicación de SECOP | ~25 % | Muy alta |
| N2 | Entidad municipal con una ubicación igual a su sede | ~30 % | Alta |
| N3 | Una ubicación distinta de la sede | ~20 % | Alta-media |
| N4 | BPIN con un municipio, cuando la ubicación de una entidad nacional o departamental repite la sede | ~5 % | Media-alta |
| N5 | Municipio mencionado en el objeto del contrato (94,8 % de concordancia) | ~7 % | Media |
| N6 | Varios municipios | ~3-4 % | Se asigna al departamento o se prorratea con marca |
| N7 | Entidad nacional o departamental sin otra evidencia | ~8-10 % | Baja: **no se pinta en el mapa municipal** |
| N8 | Sin ubicación válida | <0,1 % | `sin_asignar` |

Cada contrato guarda `cod_mpio_ejecucion`, `cod_dpto_ejecucion`, `fuente_ubicacion`, `confianza` y `n_municipios`, y aparte `cod_mpio_sede_entidad`: "quién contrata" frente a "dónde se ejecuta".

**SECOP I** trae `municipios_ejecucion` propio, que entra en la cascada al mismo nivel que `gra4-pcp2`. Trae solo el nombre del municipio, sin departamento: los homónimos se resuelven con `departamento_entidad`, y necesita sus propios alias ("San Andres de Tumaco", "Bogotá D.C.").

### Normalización de nombres a DIVIPOLA

Sin tildes, en mayúsculas y sin puntuación, más 16 alias, coinciden el **100 %** de los pares (departamento, municipio) con ciudad definida. Algunos alias: Cali → SANTIAGO DE CALI, Cúcuta → SAN JOSÉ DE CÚCUTA, Mompós → SANTA CRUZ DE MOMPOX, Tumaco → SAN ANDRÉS DE TUMACO, Piendamó → PIENDAMÓ - TUNÍA.

- **Siempre por el par (departamento, municipio).** Hay 67 nombres repetidos entre departamentos (La Unión, Granada, Villanueva…).
- **Marcar** ubicaciones que pueden significar "todo el departamento": Boyacá»Boyacá, Córdoba, Sucre, Nariño, Bolívar, Caldas.

### Obras que no dicen "Obra"

Muchas obras municipales están clasificadas como "Decreto 092 de 2017" (convenios con Juntas de Acción Comunal) u "Otro". Se identifican también por el código UNSPSC 72xxxx (`codigo_de_categoria_principal`).

### Polígonos (MGN del DANE)

Pendiente de verificar en navegador la vigencia, el formato y la licencia del Marco Geoestadístico Nacional en el geoportal del DANE. Plan: `ogr2ogr` → `mapshaper -simplify 5-10% keep-shapes` → TopoJSON, unido por el código DANE de 5 dígitos. Un GeoJSON comunitario derivado del MGN 2018 sirve solo para prototipo: no tiene licencia declarada y le faltan municipios creados después de 2018 (Barrancominas, 94343).

## 4. Cobertura: qué falta en los datos

### SECOP I sigue vivo

| Año de firma | Contratos en SECOP I | De entidades municipales |
|---|---|---|
| 2024 | 288.863 | 215.934 |
| 2025 | 267.578 | 199.505 |
| 2026 (a nov.) | 194.404 | 141.941 |

Peso de SECOP I en el valor contratado por las alcaldías en 2025 (1.020 municipios con datos): **0 % en 419 municipios y 100 % en 278**. Patrón regional fuerte: municipios con 10 o más contratos en SECOP II son 1 de 31 en Chocó, 4 de 64 en Nariño y 2 de 30 en Córdoba, frente a 0,85 en Antioquia.

**El SECOP Integrado (`rpmr-utcd`) no sirve como atajo:** guarda una fila por versión del contrato (en oct. 2025, 170.135 filas para 82.552 contratos) y su valor para municipios sale 2,05 veces el de las fuentes primarias.

### Ausencia de contratos ≠ ausencia de gasto

Quedan fuera de SECOP II, total o parcialmente: régimen especial (ESE, empresas de servicios públicos, EICE en competencia, universidades), convenios del Decreto 092 de 2017, recursos de cooperación, y el gasto que no es contrato (nómina, transferencias de salud y educación, deuda).

**Índice contratado / comprometido** (SECOP I + II frente a CUIPO, cuentas 2.3 + 2.1.2, 2025): mediana 0,48, p10 0,03, p90 1,01. **No mide transparencia.** Se publica solo como semáforo de qué tan completa está la capa de contratación de un municipio, por bandas: <0,2 baja, 0,2-0,5 parcial, 0,5-1,0 consistente, >1,2 revisar.

### Cuándo están completos los datos

| Fuente | Rezago | Regla |
|---|---|---|
| SECOP II | 1 a 3 días hábiles | El mes más reciente se marca **provisional** |
| SECOP I | 91 % cargado al mes siguiente, 96 % a los 2 meses | Los 2 meses más recientes se marcan provisionales |
| CUIPO | ~50 días tras el cierre del trimestre | Mostrar "presupuesto al corte AAAA-T"; la ejecución es acumulada en el año |

**Estacionalidad que no es rezago:** la Ley de Garantías (Ley 996 de 2005) hizo caer la contratación ~80 % de febrero a junio de 2026, y enero y diciembre son atípicos todos los años. No se comparan como caídas de transparencia.

Cada corte guarda conteos por (fuente, mes de firma, código DANE) para medir las altas tardías con datos propios.

### CUIPO

- Los cierres de vigencia (periodo 12) están completos; el primer trimestre es el más incompleto (11 municipios ausentes en 2025-T1).
- La regla "últimos 5 dígitos de `codigo_entidad` = código DANE" falla en 7 entidades, que van en una tabla de excepciones: Guachené (19300), San José de Uré (23682), Norosí (13490), Tuchín (23815), Barrancominas (94343), Nuevo Belén de Bajirá (27493) y San Andrés (88001).
- CUIPO es jerárquico: sumar todas las cuentas duplica valores. Se filtra por código de cuenta exacto.

## 5. Datos personales y licencias

| Hallazgo | Cifra |
|---|---|
| Contratos con número de cuenta bancaria | 1.793.562 (1.453.115 de personas naturales) |
| Contratos con domicilio del representante legal | 2.078.461 |
| Contratistas personas naturales (todos los tipos) | 84,4 % |
| Contratistas de obra con NIT / con cédula | 78,76 % / 13,59 % |
| Documentos tipo tarjeta de identidad o registro civil (posibles menores) | 522 |

Que el dato sea público en datos.gov.co no exime a EKOU de la Ley 1581 de 2012: al republicarlo, EKOU es **responsable del tratamiento** (política de tratamiento y canal de reclamos).

| Dato | Acción |
|---|---|
| Cuentas bancarias, domicilios, representantes legales, supervisores, ordenadores del gasto | **No se extraen** (catálogo) |
| Documento de persona natural | Seudonimizar con HMAC-SHA256 y clave secreta, sobre el documento normalizado, con prefijo de versión (`k1_`). No rotar salvo compromiso de la clave. |
| Nombre de persona natural | Fuera de la capa pública hasta la revisión legal ([TASK-08, #9](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/9)) |
| NIT y razón social de personas jurídicas | Se publican |
| RUES | No se republican los ~7 M de registros de personas naturales |
| SIRI (sanciones) | Solo dentro de la ventana de tiempo vigente |
| Capa bronze | **Nunca se publica.** Cuidado con `actions/cache` en un repositorio público. |

**Licencias:** todas las fuentes usadas son **CC BY-SA 4.0**, excepto 83qu-fqy5 (CC0). Los datos derivados se publican como CC BY-SA 4.0, con atribución y aviso de modificación en `datapackage.json` y una página de créditos en la app.

---

## Reglas de silver, en un solo lugar

| ID | Tema | Regla |
|---|---|---|
| S01 | Unicidad | Deduplicar SECOP II por `id_contrato` (272 filas repetidas) y SECOP I por `uid` (6.480.545 filas para 6.279.022 `uid`: ~200 mil repetidas que inflarían las sumas); conservar la `ultima_actualizacion` más reciente; alertar si quedan duplicados no idénticos |
| S02 | Llaves | Contrato ↔ proceso por `proceso_de_compra = id_del_portafolio`; elegir la fila adjudicada |
| S03 | Valor | `valor_actual`; `valor_inicial` según modalidad; `ratio` y `pct_sobrecosto`; `adicion_supera_50pct`; `sobrecosto_no_calculable` |
| S04 | Atípicos | Reglas A1 a A5 |
| S05 | Pagos | `pago_reportado`; cobertura publicada |
| S06 | Fechas | `fin_original`, `retraso_dias`; `dias_adicionados` solo informativo |
| S07 | Estado | `estado_ejecucion` derivado; suspensiones desde u99c-7mfm |
| S08 | Ubicación | Cascada N1-N8 con `fuente_ubicacion` y `confianza`; normalización DIVIPOLA con alias |
| S09 | Entidad | Nivel por CHIP (NIT); tabla maestra NIT → DANE → tipo; excepciones revisadas a mano |
| S10 | Obras | `tipo_de_contrato = 'Obra'` o UNSPSC 72xxxx o Decreto 092 con objeto de obra |
| S11 | Normalización | Seed de justificaciones inglés/español; `justificacion_no_mapeada` |
| S12 | Privacidad | HMAC de documentos de personas naturales; columnas excluidas en el catálogo |
| S13 | Contexto | Cada registro lleva `urlproceso`, `fuente`, `corte` y sus banderas de calidad |
| S14 | Completitud | Meses provisionales por fuente; conteos por (fuente, mes de firma, DANE) en cada corte |

## Lo que no se verificó

- La cobertura de ejecución (8,5 %) y la tasa de lotes (17 %) salen de muestras de 2023, no de conteos nacionales.
- Los porcentajes de la cascada de ubicación son estimaciones sobre muestras de obras 2024-2025.
- Que `:id` cambie en cada reemplazo es una inferencia de alta probabilidad; se confirma al comparar dos cortes.
- Vigencia, formato y licencia del MGN del DANE.
- Fechas exactas del cronograma de obligatoriedad de SECOP II 2024-2025 (Circulares Externas 003 de 2024 y 001 de 2025).

## Referencias

- Socrata: [paginación y orden](https://dev.socrata.com/docs/queries/order), [App Tokens](https://dev.socrata.com/docs/app-tokens), [campos de sistema](https://dev.socrata.com/docs/system-fields), [Using SODA3 API](https://support.socrata.com/hc/en-us/articles/43491231777047)
- Colombia Compra Eficiente: [diccionario de datos (2026)](https://www.colombiacompra.gov.co/wp-content/uploads/2026/01/Diccionario_de_Datos_RegistrosAdministrativos-1.pdf), [gestión contractual en SECOP II](https://www.colombiacompra.gov.co/base-conocimiento/gestion-contractual-secop-ii), [Circular Externa 003 de 2024](https://www.colombiacompra.gov.co/wp-content/uploads/2025/03/circular-externa_no._003_-_obligatoriedad_secop_ii_2024-2025.pdf), [manual de datos abiertos](https://colombiacompra.gov.co/wp-content/uploads/2024/09/manual_de_datos_abiertos_actualizado.pdf)
- Normas: [Ley 1150 de 2007](https://normograma.dian.gov.co/dian/compilacion/docs/ley_1150_2007.htm), Ley 80 de 1993, Ley 1581 de 2012, Ley 996 de 2005, Decreto 1082 de 2015
- DANE: [manual de uso del MGN](https://www.dane.gov.co/files/images/MGN_Manual_Uso.pdf)
- Open Contracting Partnership: [registro OCDS de Colombia](https://data.open-contracting.org/en/publication/61), [lista de chequeo de calidad OCDS](https://www.open-contracting.org/resources/ocds-data-quality-checklist/)
- Transparencia por Colombia: [Contratación y paz 2](https://transparenciacolombia.org.co/wp-content/uploads/2025/04/TPC_ContratacionPaz_2.pdf)
- Gallego, Rivero y Martínez (2021), "Preventing rather than punishing: An early warning model of malfeasance in public procurement", *International Journal of Forecasting* 37(1), 360-377

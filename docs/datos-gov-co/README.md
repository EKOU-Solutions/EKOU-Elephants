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

## Hallazgos medidos

### CUIPO – Ejecución de Gastos (`4f7r-epif`), medido el 2026-11-22

Alcance: entidades del ámbito «Municipios» (`ambito_codigo = 'A439'`), vigencia actual (`cod_vigencia_del_gasto = '1'`).

| Periodo | Entidades | Municipios DIVIPOLA cruzados | De 1.122 |
|---|---|---|---|
| 2026-06 | 1.100 | 1.093 (con pagos > 0) | 97,4 % |
| 2025-12 | 1.102 | 1.095 | 97,6 % |

- **Cruce CHIP → DANE:** `codigo_entidad` es de 9 dígitos y **los últimos 5 son el DIVIPOLA del municipio** (`217870678` → `70678`). Comprobado contra DIVIPOLA (`gdxc-w37w`): los nombres coinciden en 1.091 de 1.093 (los 2 restantes solo difieren en el artículo: «Alto del Rosario», «Paz del Río»). Ningún municipio tiene dos entidades.
- **Excepciones de código** (7 municipios, ya presentes en CUIPO): Coveñas (`89970221`, 8 dígitos) y seis creados recientemente con prefijo `9232` (Guachené, San José de Uré, Norosí, Tuchín, Barrancominas, Nuevo Belén de Bajirá). No salen por la regla de los últimos 5 dígitos: hace falta una tabla manual de 7 filas.
- **Sin dato en CUIPO (29 de 1.122):** 18 áreas no municipalizadas y la isla (no tienen alcaldía), Bogotá D.C. (está en otro ámbito, ver abajo), San Juan de Riosecio y Lloró (sin reporte en estos periodos) y los 7 anteriores si no se corrige el cruce. Con la tabla manual y Bogotá desde su propio ámbito, quedan **2 municipios** realmente sin información (San Juan de Riosecio y Lloró).
- **Consulta pesada:** agrupar todas las entidades de un periodo tarda cerca de 4 minutos; lanza una consulta por periodo, con un tiempo de espera de 10 minutos.
- **Sin duplicar:** los valores son acumulados del año hasta el periodo, así que se toma **un solo periodo** (el último completo), nunca la suma de varios.

### CUIPO por ámbito: departamentos, Bogotá, San Andrés y descentralizados (2026-06)

CUIPO separa a quien reporta en `ambito_codigo`. Para armar el gasto de un territorio hay que mirar varios:

| Ámbito | Entidades | Cruce con DIVIPOLA | Cobertura |
|---|---|---|---|
| `A439` Municipios | 1.100 | últimos 5 dígitos = código del municipio | 1.093 de 1.122, más 7 con tabla manual |
| `A438` Departamentos | 31 | los dígitos −5 a −3 son el departamento (`112323000` → `23`) | 31 de 32 gobernaciones |
| `A441` San Andrés | 1 | `118888000` → `88` | completa el departamento 88 |
| `A440` Bogotá | 1 | `210111001` → municipio `11001` y departamento `11` | Bogotá D.C. completa |
| `A442` Establecimientos públicos territoriales | 481 | **sin regla**: códigos `9232…` que no llevan el municipio | no cruzable por código |

- **Departamentos:** con `A438` + `A441` + Bogotá se cubren los 33 códigos de departamento de DIVIPOLA, ninguno falta. Las gobernaciones suman entre $0,5 y $17,8 billones en obligaciones (Antioquia la mayor, Vaupés la menor).
- **Gasto de un departamento ≠ suma de sus alcaldías:** la gobernación es una entidad aparte. Mostrar «gasto de la gobernación» y «gasto de las alcaldías del departamento» como cifras distintas; no sumarlas sin explicarlo.
- **Descentralizados (`A442`):** institutos de cultura y deporte, empresas de vivienda, asociaciones de municipios. No se pueden asignar a un municipio con la regla de los dígitos; necesitarían un cruce por nombre o NIT. Por ahora el gasto que mostramos es **solo el de la administración central** de cada alcaldía o gobernación, y así debe decirlo la interfaz.
- **Mismas reglas que en municipios:** un solo periodo (acumulado del año), vigencia actual y sin dato = «sin información».

### Balance de una alcaldía con CUIPO: cómo sumar sin duplicar

Para mostrar «cuánto recibió y en qué lo gastó» se usan dos datasets del mismo informe:

| Pregunta | Dataset | Columna | Cuentas a tomar |
|---|---|---|---|
| ¿Cuánto recibió? | Ejecución de Ingresos `9axr-9gnb` | `total_recaudo` | `1` (total), con `1.1` ingresos corrientes y `1.2` recursos de capital |
| ¿En qué gastó? | Ejecución de Gastos `4f7r-epif` | `compromisos`, `obligaciones`, `pagos` | `2.1` funcionamiento, `2.2` deuda, `2.3` inversión (y `2` como total) |

**Las cuentas son jerárquicas y cada nivel ya incluye a sus hijos.** `2.3` es la suma de `2.3.1` y `2.3.2`, y estas de sus subcuentas. **Si se suman todas las filas de una entidad, se cuenta lo mismo seis o siete veces.** Esto nos pasó: la primera cifra de San Benito Abad que se dio en la conversación ($186.000 M de compromisos) sumaba todos los niveles y estaba inflada unas 6 veces. Regla: filtrar siempre por un solo nivel, por ejemplo `cuenta in ('2.1','2.2','2.3')`.

Comprobación con San Benito Abad, 2026-06 (millones de COP):

| | Compromisos | Obligaciones | Pagos |
|---|---|---|---|
| Funcionamiento `2.1` | 3.034 | 2.600 | 2.549 |
| Deuda `2.2` | 681 | 681 | 681 |
| Inversión `2.3` | 26.948 | 24.199 | 15.838 |
| **Total `2`** | **30.663** | **27.479** | **19.068** |

La suma de `2.1 + 2.2 + 2.3` da exactamente el total `2`, y el recaudo total (`1`) fue de **29.536**.

**Vigencia (`cod_vigencia_del_gasto`):** `1` es la vigencia actual; `2` son reservas presupuestales y `3` cuentas por pagar, que vienen de años anteriores y aparecen como filas aparte (en la tabla de arriba, solo la vigencia `1`). El balance del año usa `1`; las otras se pueden mostrar como «arrastre de años anteriores».

**No hay que esperar que ingresos y gastos cuadren:** el gasto comprometido puede pasar de lo recaudado porque se financia también con recursos del balance (ahorros de años anteriores), crédito y transferencias aún no recaudadas.

# Resumen municipal · Especificación

> Paso 2b de [Construir una página](../../../../.claude/skills/elephant-designer/references/build-page.md). Estado: **Aprobada** (Aprobación 1 y 2 el 2026-11-22). Boceto elegido: **A · La barra del balance** ([bocetos.html](bocetos.html)). Contrato: [contract.md](contract.md). Datos: [data.md](data.md).

## 1. Propósito

**Pregunta:** «¿Cuánta plata pública recibió mi alcaldía este año, en qué la gastó y cuánto ya pagó?»

**Audiencia:** público general en celular que llega por un enlace compartido a su municipio; periodistas que necesitan la cifra exacta, el año, la fuente y las dos fechas de corte.

**Prueba de 10 segundos:** la persona dice (1) cuánto recibió la alcaldía, (2) que casi todo se fue a inversión (o al rubro que sea), (3) que «comprometido» no es «pagado», y (4) que los contratos de SECOP son otra cosa.

**Dónde vive:** en la ficha del municipio del mapa ([spec del mapa](../map/spec.md)), como sección de la ficha completa y como cifra clave en la ficha media. Mismo patrón para un departamento (mismo componente, otros datos).

## 2. Contenido y jerarquía

| Orden | Contenido | Campo(s) del contrato | Componente | Tokens | Si falta / es nulo | Fase |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Año: selector con los años de la ventana. 2021 y 2022 aparecen pero llevan «sin información» | `anio`, `anios` | Select | `--el-size-small` | — | MVP |
| 2 | «En 2025 la alcaldía recibió» + **$70.684 millones** | `gastoPublico.recibido`, `anio` | Key figure | `--el-size-figure-mobile` | `recibido: null` → «Sin información» con trama; nunca $0 | MVP |
| 3 | «Y se comprometió a gastar» + cifra **$71.020 millones** y barra segmentada por rubro (inversión, deuda, funcionamiento) con su leyenda en texto y %. Cada rubro lleva su glosa en una línea («Inversión: obras, salud, educación») | `gastoPublico.total.comprometido`, `rubros[].clave`, `rubros[].etapas.comprometido` | Key figure, Progress bar, Legend key | `--el-color-line`, tokens de datos neutros (sin color de riesgo) | Rubro en 0 → «$0» y 0 % (es real); sin tramo en la barra | MVP |
| 4 | «¿Hasta dónde llegó ese dinero?»: tres barras en escala común: comprometido, recibido (`obligado`: bienes y servicios que ya llegaron, pagados o no), pagado, con su glosa en lenguaje cotidiano | `total.comprometido`, `total.obligado`, `total.pagado` | Progress bar | ídem | Si `pagado > obligado` se muestra tal cual, sin recortar y sin error | MVP |
| 5 | Aviso, si aplica, de que el gasto supera lo recibido: «El gasto puede superar lo recibido en el año porque el presupuesto también usa saldos de años anteriores y crédito.» | `total.comprometido > recibido` (calculado en la interfaz) | Alert (informativo) | — | No aparece si no se cumple | MVP |
| 6 | «Además arrastra de años anteriores»: reservas y cuentas por pagar, cada una con comprometido, recibido y pagado y su glosa («Reservas: gastos comprometidos antes que se pagan ahora») | `reservas`, `cuentasPorPagar` | Data table + texto | `el-num` | Bloque `null` → «No reportó» (no es cero ni se oculta) | MVP |
| 7 | Botón «Ver cada rubro, tabla y fuentes»: abre la tabla accesible con rubros × etapas, los tres bloques y los números exactos | todo `gastoPublico` | Button, Data table | — | — | MVP |
| 8 | **Aparte**, bajo una línea: «Contratos firmados (SECOP)»: `N` contratos · `$X` millones, con la frase «Es lo prometido en contratos, no lo gastado» | `contratado.valor`, `contratado.contratos` | Counter | `--el-color-line` | `valor: null` → «Sin información»; `contratos: 0` sin valor → «No encontramos contratos ubicados con certeza en este municipio en 2025» | MVP |
| 9 | Fuentes y fechas, dos líneas: «Gasto: CUIPO, Contaduría General de la Nación, corte 30 jun 2026» y «Contratos: SECOP II, corte 7 nov 2026». Año en curso: «Año en curso: cifras acumuladas hasta 30 jun 2026» | `fuentes[].fechaCorte`, `usadoPara`, `gastoPublico.periodo`, `completo` | Texto de pie | `--el-size-small`, `--el-color-text-muted` | — | MVP |
| — | Municipio sin ningún dato del año (`gastoPublico: null` y `contratado: null`) | ambos `null` | Alert + trama | — | «Sin información de [Municipio] en 2025» y por qué (año sin reporte aún / no reportó). Nunca ceros | MVP |
| — | San Andrés `88001` | `gastoPublico.alcance = 'departamento-isla'` | Alert (informativo) | — | «Las cifras son de San Andrés, Providencia y Santa Catalina como un solo departamento.» | MVP |

Para un departamento: los mismos puntos, con el encabezado del departamento. Contratado sale de `mapa_niveles_corte`.

## 3. Comportamiento

- **Entrar:** al tocar un municipio la ficha sube a media con la cifra clave del punto 2 (y el año por defecto); la barra del balance y el resto viven en la ficha completa, como el resto de las secciones del mapa. Se llega también por enlace compartido.
- **Cambiar de año:** el selector gobierna **todo** el resumen: recibido, rubros, barras, arrastre (reservas y cuentas por pagar) y contratos SECOP (por año de firma). Solo las fechas de corte de las fuentes no dependen del año. Actualiza las cifras y la URL. Mientras llega la respuesta, la sección conserva su altura y muestra el estado de carga. El foco queda en el selector; los cambios se anuncian en una región `aria-live` («Mostrando 2024»).
- **URL compartible:** `?anio=2024` junto al municipio (por ejemplo `/mapa/70678?anio=2024`); abrir el enlace muestra el mismo año. Sin `anio`: el año que devuelve la API por defecto.
- **Barra del balance:** no es interactiva. Cada tramo y barra tiene su cifra en texto al lado y se repite en la tabla; nada depende del hover ni del color.
- **Tabla:** «Ver cada rubro, tabla y fuentes» muestra la tabla en la ficha completa; el foco va al título de la tabla.
- **Volver:** el botón atrás del navegador vuelve al estado anterior de la ficha (año anterior o municipio anterior).
- **Movimiento:** las barras se llenan en una transición corta; con `prefers-reduced-motion` aparecen ya llenas. Ningún contenido depende de la animación.

## 4. Estados

| Estado | Qué ve la persona |
| --- | --- |
| Carga | Estructura de la sección con las barras vacías en trama gris y «Cargando el resumen de [año]». Sin cifras inventadas |
| Normal | Puntos 1–9 |
| Año sin CUIPO (2021, 2022) | Selector y SECOP si existe; el balance dice «Sin información: la Contaduría publica este detalle desde 2023» |
| Año en curso | Igual que normal, con la línea «Año en curso: cifras acumuladas hasta [fecha]» y sin la palabra «cierre» |
| Municipio sin datos (`null`) | Alert + trama + «Sin información de [Municipio] en [año]». Selector disponible para probar otro año |
| Gasto mayor que lo recibido | Alert del punto 5; sin tono de acusación |
| Error de red o 5xx | «No pudimos cargar el resumen» + botón «Intentar de nuevo»; el selector y el resto de la ficha siguen funcionando |
| Año inválido en la URL | Se usa el año por defecto y se avisa en una línea; no hay pantalla de error |
| Fase 2 | Presupuesto definitivo, ejecución %, ingresos por fuente, sectores: no se muestran |

## 5. Maquetación

- **390 px (primero):** una columna; cifras clave con `--el-size-figure-mobile`; barras al ancho completo; leyenda en filas de texto; tabla con desplazamiento solo dentro de su contenedor, nunca la página. Controles de 44 px.
- **1280 px:** la ficha del mapa pasa a panel lateral; dentro, la misma columna; la tabla se ve completa y deja de colapsar.
- A 320 px las cifras largas («$11.026 mil millones») pasan a «$11,0 billones» según el contrato de presentación; no se parten ni desbordan.

## 6. Textos

Tono directo, español de Colombia, sin jerga:
- «Recibió»: lo que ingresó a la caja de la alcaldía en el año (recaudo, no presupuesto).
- «Comprometido»: contratos u órdenes ya firmados contra el presupuesto. Todavía no es plata pagada.
- «Recibido» (campo `obligado`): los bienes o servicios ya llegaron, estén pagados o no. Se evita «por pagar» porque puede ser mayor que lo pagado.
- «Pagado»: plata que ya salió.
- Rubros: «Funcionamiento: nómina y gastos de oficina», «Pago de deuda», «Inversión: obras, salud, educación y otros servicios».
- Nunca «corrupción», «robo», «sospechoso»; no hay nombres de personas naturales. Toda cifra lleva fuente y fecha de corte.
- Contratos: «Lo contratado no es lo gastado: es lo prometido en contratos firmados en el año.»

- Nota (2026-11-22): «Año inválido en la URL» lo avisa la página, no este componente. «La alcaldía recibió» pasa a «la gobernación» según el nivel al integrar.

## 7. Preguntas abiertas

1. **Componentes:** la barra segmentada y las tres barras usan **Progress bar** (confirmado como núcleo en v1.7.0, tres tonos de tinta). El selector de año usa **Select** del catálogo; ¿preferimos botones de año (más rápido en celular, pero componente nuevo)? Recomendado: Select.
2. **Presupuesto definitivo** (`d9mu-h6ar`): ¿lo añadimos al contrato para explicar «gastó más de lo que recibió», o basta el aviso del punto 5? Recomendado: aviso por ahora.
3. **Copiar enlace** con el año: ¿se reutiliza el botón de la ficha del mapa? Recomendado: sí.
4. **Licencia** de los datos de CUIPO: confirmarla antes del pie.
5. **Departamento:** ¿misma sección, mismo lugar de la ficha? Recomendado: sí.

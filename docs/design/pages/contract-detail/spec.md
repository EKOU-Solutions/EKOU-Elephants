# Detalle de contrato · Especificación

> Paso 2b de [Construir una página](../../../../.claude/skills/elephant-designer/references/build-page.md) · 2026-11-19 · Contrato: [contract.md](contract.md) (aprobado el 2026-11-17) · Datos: [data.md](data.md) · Bocetos: [bocetos.html](bocetos.html) y [prototipo-d4.html](prototipo-d4.html).
>
> Aprobado por Jouler el 2026-11-19: **A en celular** y **D4 en escritorio**. Esta especificación escribe esas dos decisiones y las [observaciones para la maqueta](README.md#observaciones-de-jouler-para-la-maqueta-2026-11-19).

## 1. Propósito

**Pregunta:** «¿Qué se contrató aquí, entre quiénes, por cuánto y cómo lo compruebo?»

La pregunta tentativa del registro de páginas («¿por qué este contrato tiene señales?») necesita las señales de TASK-13, que no están en el contrato de la API. La página deja su lugar listo.

**Audiencia:** público general en celular, que llega desde la lista de su municipio o desde un enlace compartido. En escritorio, periodistas y veedurías que necesitan la cifra exacta, la fuente y la fecha.

**Prueba de 10 segundos:** en un celular, sin desplazar, la persona puede decir qué tipo de contrato es, de qué entidad, cuánto vale y de dónde sale el dato. Con una pantalla más, entre quiénes es y cómo comprobarlo en SECOP.

## 2. Contenido y jerarquía

Un `h1` (el tipo de contrato) y un `h2` por franja. El orden es el mismo en celular y en escritorio.

| Orden | Contenido | Campo(s) del contrato | Componente | Tokens | Si falta / es nulo | Fase |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | «Volver»: «← {municipio}» | `location.municipality` | Patrón «Volver»: `Button` secundario con `Icon` `arrow-left`, dentro de `<nav aria-label="Volver">` | `--el-control-height` | — | MVP |
| 2 | Acciones arriba (solo desde 900 px): «Compartir esta ficha» y «Ver el registro en SECOP I/II» | `source`, `sourceUrl` | `Button` secundario y primario (el primario es un enlace externo) | `--el-color-action` | Sin `sourceUrl`: no hay botón; al cierre, «SECOP no trae el enlace a este contrato. Búscalo en SECOP con el número.» | MVP |
| 3 | Lugar: «{municipio}, {departamento}» | `location` | Texto | `--el-size-small`, `--el-color-text-muted` | — | MVP |
| 4 | `h1`: tipo de contrato, en palabras comunes | `type` | Título de página | `--el-size-title-mobile`, `--el-size-title` | Tipo nulo, «Otro» o poco común: «Contrato» | MVP |
| 5 | Entidad que contrata, tal como viene | `buyer.name` | Texto | `--el-size-body` | — | MVP |
| 6 | Aviso de contrato reciente | `provisional` | `Alert` en línea, tono información | — | No se muestra si es `false` | MVP |
| 7 | Aviso «Tiene N señales para revisar» | — (TASK-13) | `Counter` o texto resaltado | — | Sin señales: no se muestra | Fase 2 |
| 8 | **¿Cuánto vale?** Cifra corta («$ 67,8 millones»), frase con el valor exacto y el cambio desde la firma, pago, y «Según SECOP II · datos al {fecha}» | `amounts.*`, `source`, fecha del corte | Cifra de la página (ver pregunta abierta 1) | `--el-size-figure-mobile`, `--el-size-figure` | Ver «Variantes del valor» | MVP |
| 9 | **¿Por qué tiene señales?** Lista numerada: título de la señal y el hecho que la sustenta; aclaración «Una señal pide revisar…» | — (TASK-13) | `SignalItem` (candidato que esta página confirma) | `--el-color-risk-*` | Sin señales: la franja no existe | Fase 2 |
| 10 | **¿Qué se contrató?** «Objeto, según SECOP» y el texto, recortado a unas tres líneas, con «Leer completo» | `description` | Texto + `Button` de texto | `--el-size-body` | Nulo: «SECOP no trae el objeto de este contrato.» | MVP |
| 11 | **¿Entre quiénes?** Entidad que contrata (nombre y NIT) y contratista | `buyer`, `supplier` | Lista de dos filas | `--el-color-line` | Sin NIT: solo el nombre. Persona natural: «Persona natural» y la explicación. Desconocido: «Sin datos del contratista» | MVP |
| 12 | **¿Cuánto dura?** Fechas de firma, inicio y fin. Si hay días agregados, dos tramos: plazo inicial y agregado. Frase del estado | `dates.*`, `status` | `ContractTerm` (nuevo, del módulo) | `--el-color-text`, `--el-color-control-border` | Sin inicio o sin fin: las fechas que haya, sin tramos, y «SECOP no trae la fecha de inicio.» o «SECOP no trae la fecha de fin.» | MVP |
| 13 | **¿Cómo se eligió al contratista?** Modalidad con su norma, explicación en una frase y «Motivo registrado» | `procurementMethod`, `methodJustification` | Texto | `--el-size-body`, `--el-size-small` | Modalidad nula: la franja no se muestra. Sin motivo: sin esa línea | MVP |
| 14 | Cierre: fuente, fecha, número en SECOP con «Copiar», «Elephants, de EKOU», y las dos acciones repetidas con los mismos colores de arriba | `source`, `id`, `sourceUrl`, fecha del corte | Texto + `Button` | `--el-color-text-muted` | — | MVP |

No se muestran: `exceedsLegalAdditionLimit` (es una señal, TASK-13), `sourceStatus`, `isPublicWorks` y el retraso (no es confiable, [data.md](data.md)).

### Variantes del valor (fila 8)

| Caso | Cifra grande | Frase |
| --- | --- | --- |
| Subió | Valor actual corto | «Se firmó por $ X: subió $ Y (Z %). Hoy vale $ W.» |
| Bajó | Valor actual corto | «Se firmó por $ X: bajó $ Y (Z %). Hoy vale $ W.» |
| Igual | Valor actual corto | «$ W. No ha cambiado desde la firma.» |
| Sin valor al firmar (`initialCents` nulo o 0) | Valor actual corto | «$ W. Sin datos del valor al firmar.» |
| Valor $ 0 | No hay cifra grande | «SECOP lo registra sin valor.» |
| No confiable (`reliable` es `false`) | No hay cifra grande | «SECOP registra $ W.» y un `Alert` en línea, tono advertencia: «Esta cifra puede tener un error de registro en SECOP» + «Revisa el contrato en la fuente antes de citarla.» Si hay valor al firmar: «Se firmó por $ X.» |
| Sin valor (`currentCents` nulo) | «Sin datos» con la trama | «SECOP no trae un valor que podamos mostrar.» |

Pago: «Pagado según SECOP: $ X» (`paidCents` con valor) · «La entidad no ha reportado pagos en SECOP.» (SECOP II, nulo) · «SECOP I no publica cuánto se ha pagado.» (SECOP I).

Cifra corta: desde un millón, «$ 67,8 millones»; desde un billón (10¹²), «$ 8,8 billones»; por debajo de un millón, el valor exacto («$ 850.000»). Un decimal, coma decimal, espacio después de «$». El valor exacto siempre acompaña a la cifra corta.

### Frase del estado (fila 12)

| `status` | Frase |
| --- | --- |
| `not_started` | «Todavía no empieza.» |
| `active` | «Está en ejecución.» |
| `suspended` | «Está suspendido, según SECOP.» |
| `finished` | «Ya terminó.» |
| `expired_unclosed` | «Ya pasó la fecha de fin y SECOP no registra el cierre. Es común: muchas entidades no registran el cierre.» |

El estado es una frase, nunca una etiqueta con color: «plazo vencido sin cierre» es el estado del 53 % de los contratos y no es una señal.

### Plazo en tramos (fila 12)

- Con `addedDays` mayor que 0, inicio y fin: dos tramos del inicio al fin. «Plazo inicial · N días» (lleno) y «Agregado después · M días» (en contorno), cada uno con sus fechas. El fin inicial es el fin menos los días agregados.
- No se dibujan tramos si falta el inicio o el fin, si el fin es anterior al inicio o si los días agregados son iguales o mayores que la duración. Quedan las fechas.
- La firma va como fecha («Se firmó el 9 jun 2025»), no como tramo.
- No se pinta el tiempo posterior al fin ni se usa color de riesgo: el atraso entra con TASK-13.
- Desde 768 px cada rótulo va bajo su tramo; en anchos menores, en una lista con su clave, para que un tramo corto no desborde.

### Tipo de contrato en el titular (fila 4)

| `type` (sin distinguir mayúsculas) | Titular |
| --- | --- |
| Prestación de servicios | Contrato de prestación de servicios |
| Obra | Contrato de obra |
| Suministro, Suministros | Contrato de suministro |
| Compraventa | Contrato de compraventa |
| Interventoría | Contrato de interventoría |
| Consultoría | Contrato de consultoría |
| Arrendamiento de inmuebles / de muebles | Contrato de arrendamiento |
| Seguros | Contrato de seguros |
| Comodato | Contrato de comodato |
| Cualquier otro, «Otro», nulo | Contrato |

### Modalidad con su norma (fila 13)

Regla de Jouler: la modalidad siempre lleva su norma. Se reconoce por palabras del texto de SECOP, que escribe distinto la misma modalidad en SECOP I y II.

| Si el texto contiene | Se muestra | Explicación |
| --- | --- | --- |
| «directa» | Contratación directa (Ley 1150 de 2007) | La entidad contrata sin concurso; la ley lo permite en ciertos casos. |
| «mínima cuantía» | Mínima cuantía (Ley 1474 de 2011) | Compra de bajo valor: la entidad invita a ofertar y elige el menor precio que cumpla. |
| «licitación» | Licitación pública (Ley 80 de 1993) | Concurso abierto: cualquiera que cumpla los requisitos puede ofertar. |
| «abreviada» o «subasta» | Selección abreviada (Ley 1150 de 2007) | Concurso más corto que la licitación, para ciertos bienes, servicios y montos. |
| «concurso de méritos» | Concurso de méritos (Ley 1150 de 2007) | Concurso para consultorías: se elige por experiencia y calidad, no por precio. |
| «régimen especial» | Régimen especial | La entidad contrata con reglas propias, distintas de las generales. |
| Otro texto | El texto de SECOP, tal como viene | Sin explicación |

El «(con ofertas)» que SECOP II agrega a algunas modalidades no se explica: no está comprobado qué significa en cada caso (pregunta abierta 3).

## 3. Comportamiento

- **Dirección:** `/contratos/{id}`, con el id de SECOP tal cual. Abrir el enlace muestra la misma ficha a cualquiera.
- **Origen de la visita (para el 404):** viene «de Elephants» solo si la página anterior es del mismo sitio y la pestaña tiene historial; si no, es «por un enlace».
- **Volver:** «← {municipio}» lleva siempre a `/mapa/{código}`; no es el «atrás» del navegador, porque quien llega por un enlace no tiene historial. Cuando exista la lista de contratos del municipio (TASK-11), apuntará a ella.
- **Ver el registro en SECOP:** enlace al `sourceUrl`, en otra pestaña, con `rel="noopener"` y el ícono de enlace externo. El nombre accesible dice que abre otra pestaña.
- **Compartir esta ficha:** abre el menú de compartir del sistema con el título y la dirección. Si el navegador no lo tiene, copia el enlace y lo dice («Enlace copiado.»). Si falla: «No se pudo compartir. Copia la dirección de la página.»
- **Copiar** (número en SECOP): copia el id y lo dice («Número copiado.»).
- **Leer completo:** abre el objeto en su lugar, sin salir de la página, y el botón pasa a «Leer menos». `aria-expanded` refleja el estado. Solo aparece si el objeto pasa de 220 caracteres. El foco se queda en el botón.
- **Anuncios:** los mensajes de copiar y compartir salen en una alerta flotante (`Alert`, variante flotante), fija abajo de la ventana. Se cierra sola a los 5 segundos (la constante `TOAST_DURATION_MS` de `Alert`), sea éxito o falla, y antes con «Cerrar». Puede tapar por unos segundos lo que queda debajo: no se reserva espacio en blanco. El foco se queda en el botón que se tocó.
- **Foco al llegar:** en el `h1`. Título de la pestaña: «{titular} · {entidad} · EKOU Elephants».
- **Movimiento:** ninguno.

## 4. Estados

| Estado | Qué se ve |
| --- | --- |
| Carga | El «volver» genérico («← Mapa») y un `Alert` de información «Cargando el contrato…» con `aria-busy` en la página |
| Contrato | La ficha |
| Contrato reciente (`provisional`) | La ficha con el aviso «Contrato reciente. SECOP puede no haberlo cargado completo todavía.» |
| Valor no confiable, valor $ 0, sin valor | Ver «Variantes del valor» |
| No existe (404 o id con forma inválida) | `h1` «No encontramos ese contrato» + «Puede que el enlace esté incompleto, o que el contrato no esté entre los que tenemos: los firmados desde 2021 y ubicados en un municipio.» Una acción: **«Ir al mapa»** si la persona llegó por un enlace; **«Volver»** (atrás del navegador) si venía de otra página de Elephants |
| Datos no disponibles (503 o falla de red) | `Alert` en línea, tono peligro: «No pudimos cargar este contrato» + «Vuelve a intentarlo en un momento.» con «Reintentar», y «Ir al mapa» |
| Con señales (fase 2) | Aviso bajo el titular y franja «¿Por qué tiene señales?». Solo en historias de vista previa, con niveles de ejemplo |

«Sin datos» nunca se muestra como 0: valor nulo, pago no reportado y contratista sin documento tienen cada uno su texto.

## 5. Maquetación

- **Celular (390 px, desde 320):** una columna. Cada franja lleva su pregunta arriba y la respuesta debajo. Las acciones de arriba no se muestran: van solo al cierre, a todo el ancho, una bajo la otra. La cifra va a `--el-size-figure-mobile`.
- **Desde 900 px:** las acciones aparecen también arriba, en la línea de «volver». La cifra pasa a `--el-size-figure`. Al cierre, la fuente a la izquierda y las acciones a la derecha.
- **Desde 1100 px (escritorio, 1280):** cada franja es una fila: la pregunta a la izquierda (240 px) y la respuesta a la derecha. Ancho máximo del contenido: 1200 px, centrado. Los textos corridos no pasan de 72 caracteres por línea.
- **Dos niveles de franja:** «¿Cuánto vale?» y «¿Por qué tiene señales?» llevan línea fuerte (`--el-rule-strong`, `--el-color-line-strong`) y pregunta grande (`--el-size-section`; en celular `--el-size-subsection`). Las demás, línea fina (`--el-color-line`) y pregunta de tamaño de texto, en negrita.
- Los nombres y el objeto se muestran como los escribe SECOP y pueden partir línea en cualquier parte (`overflow-wrap: anywhere`).

## 6. Textos

Los de las tablas de arriba, más:

- Persona natural: «Persona natural» + «No mostramos nombres de personas para proteger sus datos. El registro oficial está en SECOP.»
- Sin documento del contratista: «Sin datos del contratista» + «SECOP no trae su documento.»
- Fuente junto a la cifra: «Según SECOP II · datos al 7 nov 2026».
- Cierre: «Fuente: SECOP II, Colombia Compra Eficiente · datos al 7 nov 2026 · Número en SECOP: CO1.PCCNTR.7954915 · Copiar · Elephants, de EKOU».
- Cierre, una vez: «SECOP es el registro público de los contratos del Estado.»
- Señales (fase 2): «Tiene 2 señales para revisar» · «Una señal pide revisar. No prueba nada irregular: puede tener una explicación.» El enlace «Cómo se calculan» entra cuando exista la página de metodología (TASK-07). Cada señal dice su nivel en texto («Gravedad alta», «Gravedad intermedia», «Gravedad baja»): califica la señal, no el contrato. En la vista previa, un aviso «Señales de ejemplo.» y la marca «Ejemplo» junto a la pregunta.
- Fechas: «9 jun 2025». Pesos: «$ 67.815.383». Porcentaje: «20,9 %».

La fecha de «datos al» es la del corte. La API del detalle entrega el mes (`cut`, «2026-11»); el día sale de `/api/mapa/corte` (`fechaCorte`).

Ningún texto usa «corrupción», «robo», «sospechoso», «incumplido» ni «irregular» como afirmación. No aparece ningún nombre de persona natural.

## 7. Preguntas abiertas

1. **La cifra en pesos no cabe en `KeyFigure`,** que solo sabe de conteos y proporciones. La página compone su cifra con los tokens de cifra. ¿Se agrega una variante «monto» a `KeyFigure`?
2. **Fin inicial:** silver trae `fecha_fin_original` (29 ene 2026 en el contrato de Pasto) y no coincide con el fin menos los días agregados (31 dic 2025). La página usa lo segundo, que sale del contrato de la API. ¿Se publica `originalEnd` en la API?
3. **Normas y explicaciones de cada modalidad:** las escribió el flujo de diseño. Falta la revisión de Esteban o de quien lleve lo legal (TASK-08).
4. **Contrato sin señales:** hoy la ficha no dice nada. TASK-13 decide si hay un texto que no suene a «todo está bien».
5. **Niveles de las señales:** los colores por gravedad de la vista previa son de ejemplo; los niveles reales salen de TASK-07 y TASK-13, que también deciden si el nivel es de cada señal o del contrato.
7. **SECOP en celular:** «Ver el registro en SECOP» y «Compartir» solo están al cierre, a unas dos pantallas (opción A aprobada). ¿Se agrega un enlace corto junto a «Según SECOP II · datos al…»?
8. **Plazo visual en el caso típico:** sin días agregados, el plazo son tres fechas, sin barra. ¿Se dibuja un tramo único de inicio a fin?
9. **Valor $ 0:** «SECOP lo registra sin valor» puede leerse como «sin datos». ¿Se cambia a «SECOP lo registra por $ 0»?
10. **Régimen especial** va sin norma: no hay una sola ley que lo cubra.
6. **Encabezado del sitio:** no hay una estructura aprobada de encabezado y navegación común. La ficha solo trae su «volver».

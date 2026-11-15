# Construir una página

Resultado: `docs/design/pages/<pagina>/`, el diseño de una página construido solo sobre el contrato de la API, los tokens aprobados y los componentes del catálogo, listo para desarrollo.

Trabajamos en **vertical**: una página desde los datos hasta el diseño aprobado, y luego la siguiente. Nada de una página se supone de antemano. La [referencia tentativa de páginas](../../../../docs/design/pages/README.md#referencia-tentativa) y los componentes candidatos son puntos de partida, nunca especificaciones.

Explicación para desarrollo, con diagramas: [`docs/design/design-flow.md`](../../../../docs/design/design-flow.md).

## Puertas

Detente en cada puerta y espera la aprobación explícita del equipo. Un paso no empieza hasta que la puerta anterior se haya pasado.

| Paso | Resultado | Puerta |
| --- | --- | --- |
| 0. Revisar el contrato | `contract.md` | Contrato presente y completo |
| 1. Explorar los datos | `data.md` | — |
| 2. Definir la página | `spec.md` | **Aprobación 1** |
| 3. Componentes | catálogo y Storybook actualizados (si hace falta) | **Aprobación por cada componente nuevo** |
| 4. Maqueta | `mockup.html` (+ `build.py` si se genera) | — |
| 5. Validar | `validation.md` | — |
| 6. Aprobar y entregar | `README.md` con estado «Aprobada» | **Aprobación 2** |

## 0. Revisar el contrato (bloqueante)

Antes de cualquier trabajo de diseño, confirma que existe el **contrato de la API** de la página. Es el contrato de **nuestra propia API**: los endpoints y las formas de respuesta que consumen las pantallas. No es un contrato de SECOP ni la fuente de datos abiertos.

El camino de los datos es fijo:

```
fuentes de datos abiertos (datos.gov.co …) → ingesta (TASK-06) → nuestra base de datos o archivos JSON → nuestra API → pantallas
```

El diseño depende solo del último tramo, nuestra API. Los campos crudos de la fuente nunca llegan directamente a una página. La API puede seguir en construcción; su contrato, no.

Formas aceptadas: OpenAPI, JSON Schema o tipos de TypeScript, hasta que TASK-03 fije una. Lo mínimo para cada endpoint que usa la página:

- [ ] Endpoint (método, ruta, parámetros como el filtro de territorio DANE).
- [ ] Cada campo: nombre, tipo, unidad o formato (COP, %, fecha), y si puede ser nulo o faltar.
- [ ] Al menos una respuesta de ejemplo que cumpla el esquema.
- [ ] Fase de cada campo: MVP o fase 2.
- [ ] Origen de cada campo: el id del conjunto de datos de `docs/fuentes-de-datos.md` del que lo toma la ingesta, o «calculado» más el dueño de la regla (por ejemplo, TASK-07 para el nivel de riesgo). Esta trazabilidad permite que cada cifra muestre su fuente y su fecha.

Si falta algo, **detente**. Lista lo que falta en `contract.md` y pide al equipo o a backend que lo complete. Nunca diseñes sobre campos supuestos.

Registra en `contract.md` dónde vive el contrato (ruta o URL más commit o versión) y la fecha en que se revisó.

## 1. Explorar los datos

Trabaja con datos reales, en este orden de preferencia:

1. **Nuestra API**, si el endpoint responde (en cualquier entorno).
2. **La salida de la ingesta**: filas de la base de datos o los archivos JSON que escribe la ingesta, con la forma del contrato.
3. **La respuesta de ejemplo del contrato**, contrastada con muestras de los conjuntos de datos abiertos de los que salen los campos (`datos.gov.co`, sin autenticación; ver `docs/fuentes-de-datos.md`). Lleva esas muestras a la forma del contrato; nunca diseñes sobre la forma cruda de la fuente.

Registra cada consulta o archivo con su ubicación y fecha.

`data.md` responde:

- **Qué hay de verdad:** porcentaje de llenado de cada campo, valores típicos y extremos (el nombre más largo, el monto más grande, cero, nulo), volúmenes (cuántas filas devuelve un territorio o una lista).
- **Qué es de fase 2:** campos que la página todavía no puede mostrar.
- **Datos sensibles:** nombres o documentos de personas naturales. Anonimízalos en todos los artefactos hasta que TASK-08 diga otra cosa; se pueden mostrar empresas y entidades públicas.
- **Sorpresas** que cambian el diseño, por ejemplo un campo vacío en la mitad de los registros.

## 2. Definir la página (`spec.md`)

Un solo documento, en este orden:

1. **Propósito:** la pregunta que responde la página, la audiencia (brief) y la prueba de 10 segundos: qué debe entenderse primero.
2. **Contenido y jerarquía:** una tabla ordenada, donde la fila 1 es lo que se ve primero.

   | Orden | Contenido | Campo(s) del contrato | Componente | Tokens | Si falta / es nulo | Fase |
   | --- | --- | --- | --- | --- | --- | --- |

3. **Estados:** carga, resultado vacío, «Sin datos» (nunca mostrado como 0 ni como riesgo bajo), error con forma de recuperarse, campos de fase 2 ocultos.
4. **Maquetación:** primero celular (390 px), luego escritorio (1280 px); qué se mueve o se colapsa.
5. **Textos:** español de Colombia para la ciudadanía, en el tono directo acordado. Nunca «corrupción», «robo» ni «sospechoso»; nunca nombres de personas naturales. Toda cifra lleva su fuente y su fecha.
6. **Preguntas abiertas** para el equipo.

Cada fila debe rastrearse hasta un campo del contrato o una regla fija. Lo que no se pueda rastrear se quita o se lista como pregunta abierta. Obtén la **Aprobación 1**.

## 3. Componentes

Para cada fila de la especificación:

1. Usa un **componente del catálogo**. El catálogo está en Storybook (`npm run storybook`, sección Componentes) y su fuente es la [guía del sistema de diseño v1.0](../../../../docs/design/guide/README.md): `components.json` lista cada componente y `design-system.md` reúne las reglas.
2. Los componentes con `"status": "candidate"` (estado, barra de cobertura, desglose en barras, avance frente a lo esperado, señal) se aprueban o se descartan aquí, la primera vez que una página real los necesita. Si se aprueban, pásalos a `core`; si se descartan, elimínalos.
3. Si ninguno sirve, propone un **componente nuevo**:
   - propósito, anatomía, variantes, estados, tokens, accesibilidad, hacer / evitar;
   - una historia en Storybook con sus estados (ver `.storybook/docs/HowWeWork.mdx`). La página HTML `source.html` es histórica y ya no se amplía.

   Itera hasta que el equipo lo apruebe. Luego agrégalo a la guía:
   - `components.css`;
   - `components.json`;
   - su historia en Storybook: junto al componente en `src/` si ya es React, o en `.storybook/catalog/` mientras sea solo especificación.

   Después ejecuta `build.py`, que falla si `components.json` no cuadra con el CSS o los tokens. Sube la versión menor de la guía y anota el cambio en su README. Nunca uses un componente en una página antes de que esté en el catálogo.
4. Un token nuevo sigue el mismo camino: entra en `tokens.json` y `build.py` regenera `tokens.css` y comprueba el contraste. Nunca uses un hex suelto.
5. Un cambio de dirección (paleta, tipografía, lenguaje visual) no se hace aquí. Es una [ronda](round.md).

## 4. Maqueta

`mockup.html` usa solo `tokens.css` y `components.css` de la guía, más su propia maquetación de página. Requisitos:

- Datos del paso 1, conformes al contrato, marcados como muestra con su fecha; personas naturales anonimizadas.
- Celular y escritorio.
- Tema claro y oscuro.
- Al menos un caso extremo: el nombre más largo, un campo faltante, una lista vacía.

Si la página reutiliza las herramientas de los ejemplos, genérala con un `build.py` pequeño (biblioteca estándar de Python) e ignora la salida generada, como hacen las rondas.

## 5. Validar (`validation.md`)

- Los pares de contraste pasan (`build.py`); el riesgo nunca se comunica solo con color.
- Sin desplazamiento horizontal a 320, 390, 768 y 1280 px; legible con zoom al 200 %.
- Orden de teclado y foco visible; nombres accesibles en botones de ícono, mapa y gráficos. Ejecuta `design:accessibility-review`.
- `impeccable detect` sobre la maqueta. Reporta como tales las advertencias aceptadas (trama gris).
- Textos revisados contra las reglas de tono (`design:ux-copy`).
- La prueba de 10 segundos de la especificación, respondida con honestidad.
- Storybook: `npm run build-storybook` sin errores; las historias de los componentes que usa la página, sin fallas en el panel de accesibilidad, en claro y oscuro.
- Límites: qué no se comprobó.

## 6. Aprobar y entregar

Cuando el equipo apruebe (**Aprobación 2**):

- Pon el `README.md` de la página en «Aprobada» con la fecha.
- Agrega o actualiza su fila en `docs/design/pages/README.md`.

La entrega es la carpeta misma:

- `contract.md`: de qué versión del contrato depende el diseño.
- `spec.md`: jerarquía, relación campo → componente → token, estados y textos.
- `mockup.html`: el objetivo visual.
- `validation.md`: qué se verificó.
- Las historias de Storybook de cada componente nuevo o confirmado en el paso 3.

Si el contrato cambia después de la aprobación, la página vuelve al paso 0: revisa el contrato de nuevo y actualiza `spec.md`.

No hagas commit ni publiques sin la instrucción del equipo.

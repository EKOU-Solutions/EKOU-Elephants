# Construir una página

**Lee** (además de [`contexto.md`](../contexto.md)): `docs/design/discovery/brief.md`, `docs/design/pages/README.md` y `docs/design/guide/design-system.md` al llegar al paso 2; `.storybook/docs/HowWeWork.mdx` al llegar al paso 3. Los pasos 0 y 1 son de `elephant-data`, que lee lo suyo.

Resultado: `docs/design/pages/<pagina>/`, el diseño de una página construido solo sobre el contrato de la API, los tokens aprobados y los componentes del catálogo, listo para desarrollo.

Trabajamos en **vertical**: una página desde los datos hasta el diseño aprobado, y luego la siguiente. Nada de una página se supone de antemano. La [referencia tentativa de páginas](../../../../docs/design/pages/README.md#referencia-tentativa) y los componentes candidatos son puntos de partida, nunca especificaciones.

Explicación para desarrollo, con diagramas: [`docs/design/design-flow.md`](../../../../docs/design/design-flow.md).

## Puertas

Detente en cada puerta y espera la aprobación explícita del equipo. Un paso no empieza hasta que la puerta anterior se haya pasado.

| Paso | Resultado | Puerta |
| --- | --- | --- |
| 0. Revisar el contrato | `contract.md` | Contrato presente y completo |
| 1. Explorar los datos | `data.md` | — |
| 2. Experiencia y especificación | `bocetos.html`, `spec.md` | **El equipo elige un boceto** y da la **Aprobación 1** |
| 3. Componentes | catálogo y Storybook actualizados (si hace falta) | **Elección de variante y aprobación por cada componente nuevo** |
| 4. Maqueta en Storybook | historias de `Módulos/<Módulo>/` (pantalla y componentes) | — |
| 5. Validar | `validation.md` | — |
| 6. Aprobar y entregar | `README.md` con estado «Aprobada» | **Aprobación 2** |

Quién hace cada paso (ver [roles](roles.md)): 0 y 1, `elephant-data`; 2, `elephant-designer`, con `elephant-ux` sobre los bocetos; 3 y 4, `elephant-ui` (uno por componente; la pantalla, al final); 5, `elephant-ux` y `elephant-tester` en paralelo; las puertas y el paso 6, `elephant-designer` con el equipo.

Antes de empezar, confirma que el pedido es una página o pantalla completa. Un componente suelto va por `/crear-componente`; un cambio puntual, por `/ajuste`; una revisión, por `/revisar-implementacion`.

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

## 2. Experiencia y especificación

Primero se decide cómo se vive la página; después se escribe la tabla. Un error de composición se descubre en un boceto de minutos, no en la pantalla terminada.

### Estructura compartida (una sola vez)

El encabezado, la navegación entre páginas, el filtro global de territorio y el pie con fuente y metodología son de todas las páginas. Si todavía no están diseñados y aprobados, se diseñan **antes** de la primera página, con este mismo flujo (`/crear-pantalla estructura compartida`), y quedan en Storybook. Una página no inventa su propia estructura: usa la aprobada.

### 2a. Experiencia (`bocetos.html`)

1. **Analiza qué viene a hacer la persona.** Con el brief y `data.md`, escribe en pocas líneas: quién llega y desde dónde (por ejemplo, un enlace compartido en el celular), qué quiere lograr, y el recorrido paso a paso hasta lograrlo. Ese recorrido, no el orden de los campos de la API, define qué va primero.
2. **Propón dos o tres composiciones** que resuelvan ese recorrido de formas distintas de verdad (no variaciones de detalle). Para cada una:
   - el boceto a 390 px;
   - su **jerarquía visual**: qué se ve primero, segundo y tercero, y por qué ese orden sirve a la tarea;
   - su **comportamiento**: qué pasa en cada toque, cómo se entra y cómo se sale de la página;
   - qué favorece y qué sacrifica;
   - dónde está la **apuesta fuerte**: el único lugar donde la página busca impresionar. El resto queda sobrio.
3. **Recomienda una**, la primera de la lista, con el motivo.

Los bocetos van en un solo archivo, `docs/design/pages/<pagina>/bocetos.html`, escrito a mano y pequeño:

- Las opciones lado a lado, cada una en un marco de 390 px, rotuladas A, B, C; la recomendada, marcada.
- **Baja fidelidad:** cajas, líneas y escala de grises con `../../guide/tokens.css`; sin color de riesgo, sin íconos, sin pulido. Sí con **textos y cifras reales** de `data.md` (el titular, la cifra más grande, el nombre más largo): la jerarquía no se puede juzgar con texto de relleno.
- Debajo de cada marco: el orden de lectura 1, 2, 3, qué favorece y qué sacrifica.
- Si el escritorio cambia la composición (no solo el ancho), agrega un marco de 1280 px de la opción recomendada.

Captúralos con `npm run design:check -- --html docs/design/pages/<pagina>/bocetos.html` (deja las imágenes en `.design-check/screenshots/`). Pide la crítica del `elephant-ux` sobre esas capturas y ajusta lo que acojas.

Preséntale al equipo: el recorrido, las opciones con la recomendada primero, la captura o el archivo para abrir en el navegador, y lo que dijo la crítica. **El equipo elige.** El archivo se conserva como registro de la decisión: anota en él cuál se eligió y la fecha.

### 2b. Especificación (`spec.md`)

Se escribe sobre el boceto elegido. Un solo documento, en este orden:

1. **Propósito:** la pregunta que responde la página, la audiencia (brief) y la prueba de 10 segundos: qué debe entenderse primero.
2. **Contenido y jerarquía:** una tabla ordenada, donde la fila 1 es lo que se ve primero. El orden es el orden de lectura del boceto elegido.

   | Orden | Contenido | Campo(s) del contrato | Componente | Tokens | Si falta / es nulo | Fase |
   | --- | --- | --- | --- | --- | --- | --- |

3. **Comportamiento:**
   - qué pasa en cada toque o acción, y a dónde lleva cada enlace;
   - cómo se llega a la página y cómo se vuelve atrás;
   - la **URL de cada estado** que se pueda compartir (territorio, filtros): abrir el enlace muestra lo mismo que veía quien lo compartió;
   - a dónde va el foco después de cada acción;
   - si algo se mueve, qué pasa con `prefers-reduced-motion` (regla de [`contexto.md`](../contexto.md)).
4. **Estados:** carga, resultado vacío, «Sin datos» (nunca mostrado como 0 ni como riesgo bajo), error con forma de recuperarse, campos de fase 2 ocultos.
5. **Maquetación:** primero celular (390 px), luego escritorio (1280 px); qué se mueve o se colapsa.
6. **Textos:** español de Colombia para la ciudadanía, en el tono directo acordado. Nunca «corrupción», «robo» ni «sospechoso»; nunca nombres de personas naturales. Toda cifra lleva su fuente y su fecha.
7. **Preguntas abiertas** para el equipo.

Cada fila debe rastrearse hasta un campo del contrato o una regla fija. Lo que no se pueda rastrear se quita o se lista como pregunta abierta. Obtén la **Aprobación 1**.

## 3. Componentes

Para cada fila de la especificación:

1. Usa un **componente del catálogo**. El catálogo está en Storybook (`npm run storybook`, sección Componentes); `components.json` lista cada componente (comando corto en [`contexto.md`](../contexto.md)).
2. Si hace falta un **componente nuevo**, o la página usa un **candidato**, sigue [Crear un componente](component.md) para cada uno: definición, variantes con una recomendada, elección del equipo, implementación, revisión y commit. Nunca uses un componente en una página antes de que esté en el catálogo.
3. Un token nuevo entra por `tokens.json`; `build.py` regenera `tokens.css` y comprueba el contraste. Nunca uses un hex suelto.
4. Un cambio de dirección (paleta, tipografía, lenguaje visual) no se hace aquí. Es una [ronda](round.md).

## 4. Maqueta en Storybook

La maqueta es la **pantalla real en Storybook**: no hay `mockup.html`. Se construye una sola vez, con los componentes React, y es lo que después usa la aplicación.

- **Dónde:** `src/modules/<módulo>/ui/<Page>Page/`, con `<Page>Page.tsx`, `<Page>Page.module.css`, `<Page>Page.stories.tsx` y `<Page>Page.fixtures.ts`. Título de la historia: `Módulos/<Módulo>/<Page>Page`.
- **Agrupada con su módulo:** los componentes que la pantalla arma con los componentes UI (organismos: paneles, secciones, el mapa) viven en `src/modules/<módulo>/ui/<Component>/` con el título `Módulos/<Módulo>/<Component>`. Así Storybook refleja el módulo: la pantalla y sus piezas quedan juntas.
- **Pantalla presentacional:** recibe los datos y el estado por props; no llama a la API. Quien pide los datos es el contenedor o la ruta de la aplicación. Así cada estado se muestra con una historia.
- **Datos de muestra** (`fixtures`): los del paso 1, con la forma exacta del contrato (tipados con los tipos del contrato), marcados como muestra con su fecha y con las personas naturales anonimizadas.
- **Una historia por estado de la especificación:** normal, carga, resultado vacío, «Sin datos», error con forma de recuperarse, y al menos un caso extremo (el nombre más largo, un campo faltante, el monto más grande).
- Usa `parameters: { layout: 'fullscreen' }`. Celular, escritorio y los dos temas no necesitan historias aparte: `npm run design:check` renderiza cada historia a 320, 390, 768 y 1280 px en claro y oscuro.
- La maquetación propia de la pantalla va en su CSS Module y solo con tokens `--el-*`.

## 5. Validar (`validation.md`)

**Automático.** Ejecuta `npm run design:check -- --filter <módulo>` y, antes de pedir la aprobación, el barrido completo (`npm run design:check`). Debe terminar sin fallas. Comprueba, en cada historia × tema × ancho: que renderiza, axe (WCAG 2.2 A y AA y buenas prácticas), que no hay desplazamiento horizontal, y con `build.py` el contraste de los tokens y el catálogo. Si se tocó código en `src/`, también `npm run check`. Copia en `validation.md` la línea de resumen del comando.

**Con juicio, sobre las capturas** de `.design-check/screenshots/` (no juzgues solo desde el código):

- Los avisos «incompleto» de axe (contraste sobre rellenos, trama y SVG), uno por uno.
- El riesgo nunca se comunica solo con color.
- Orden de teclado y foco visible; nombres accesibles en botones de ícono, mapa y gráficos (`design:accessibility-review`). Legible con zoom al 200 %.
- **Jerarquía visual:** sobre la captura de 390 px, lo que se ve primero, segundo y tercero coincide con el orden de la especificación y del boceto elegido. Claridad contra el brief (`design:design-critique`) y la prueba de 10 segundos, respondida con honestidad.

Esta parte la hacen el `elephant-ux` (experiencia, jerarquía, textos) y el `elephant-tester` (reglas, accesibilidad, contrato, código), en paralelo y sin haber construido la pantalla. Consolida sus hallazgos en `validation.md`, corrige los que apliquen y vuelve a ejecutar el comando.
- Textos contra las reglas de tono (`design:ux-copy`).
- **Peso:** el tamaño del JavaScript, del CSS y de los datos que carga la pantalla (por ejemplo, la geometría del mapa), tomado de `npm run build`. El brief pide celular de gama media con datos limitados; el equipo no ha fijado un límite, así que se reporta la cifra y se avisa si creció.
- Límites: qué no se comprobó.

## 6. Aprobar y entregar

Antes de la **Aprobación 2**, en las páginas clave (el mapa, y las que el equipo marque): una persona del equipo la prueba **en un celular real**, de ser posible con alguien que no conozca el producto, y hace la prueba de 10 segundos del brief. El resultado se anota en `validation.md`. La respuesta de un agente no reemplaza esta prueba.

Cuando el equipo apruebe (**Aprobación 2**):

- Pon el `README.md` de la página en «Aprobada» con la fecha.
- Agrega o actualiza su fila en `docs/design/pages/README.md`.

La entrega es la carpeta misma:

- `contract.md`: de qué versión del contrato depende el diseño.
- `bocetos.html`: las opciones que se consideraron y cuál se eligió.
- `spec.md`: jerarquía, relación campo → componente → token, estados y textos.
- Las historias de `Módulos/<Módulo>/` en Storybook: la pantalla (el objetivo visual, ya en React) y sus componentes, con sus datos de muestra.
- `validation.md`: qué se verificó.
- Las historias de Storybook de cada componente nuevo o confirmado en el paso 3, ya con su commit.

Si el contrato cambia después de la aprobación, la página vuelve al paso 0: revisa el contrato de nuevo y actualiza `spec.md`.

No hagas commit ni publiques sin la instrucción del equipo.

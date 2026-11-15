---
name: elephants-design
description: Úsala para cualquier trabajo visual o de interfaz en EKOU Elephants, del ajuste más pequeño a una iteración profunda - sistema de diseño, Storybook, tokens, componentes, pantallas o páginas, mapa, textos de la interfaz, rondas y auditorías. Clasifica el pedido (ajuste, construir una página, auditoría, ronda, descubrimiento), aplica el flujo acordado y decide cuándo llamar a las otras skills de diseño. Obligatoria por la regla global de AGENTS.md.
---

# Elephants design

Flujo dueño del diseño en este repositorio. Las otras skills de diseño (propias o de terceros) son herramientas que este flujo llama; esta skill decide cuándo, cómo y qué prevalece.

**Regla global (`AGENTS.md`):** ningún cambio de diseño, de pantalla, de componente visual, de token o de texto de la interfaz se hace fuera de este flujo, por pequeño que sea. Si te piden saltártelo, no lo hagas: explica que debe pasar por aquí e indica el comando (`/elephants-design` en Claude, `$elephants-design` en Codex, la skill `elephants-design` en Antigravity).

## Leer primero, siempre

1. `docs/design/README.md` (índice, reglas de rondas, registro de revisiones).
2. `docs/design/visual-direction.md` (decisiones aceptadas).
3. `docs/design/discovery/brief.md` si existe (la vara de medir).
4. La guía aceptada: `docs/design/guide/design-system.md` y `components.json` (v1.0, Ronda 05 editorial + Public Sans, aceptada el 2026-11-08). Lee el README de la última ronda solo si hay una ronda en curso.
5. Storybook, la referencia visual viva: `.storybook/docs/HowWeWork.mdx` y la historia del componente o la página que vas a tocar (`.storybook/catalog/` o `src/**/*.stories.tsx`). Para verlo: `npm run storybook`.
6. Para trabajo de páginas: `docs/design/pages/README.md` (registro de páginas y referencia tentativa) y `docs/fuentes-de-datos.md`.

No le preguntes al equipo nada que estos archivos ya respondan.

## Precedencia

1. Decisiones explícitas de las personas del equipo registradas en los archivos de arriba.
2. El brief de descubrimiento.
3. Las reglas de esta skill.
4. Los consejos de skills de terceros (Impeccable, etc.).

Un hallazgo de terceros que contradiga 1 o 2 se reporta como pregunta para el equipo; nunca se aplica en silencio. Fijo hasta que TASK-07 decida otra cosa: roles de riesgo azul / amarillo / rojo cálido, trama gris para datos faltantes, ningún umbral de riesgo inventado, «señal, no veredicto».

## Elegir la ruta

Clasifica el pedido y elige la ruta más corta que sea segura. Si durante una ruta aparece algo de una ruta más profunda, para y escala.

| Situación | Ruta |
| --- | --- |
| Cambio puntual que **mantiene la dirección**: un texto de la interfaz, un espaciado, un estado que falta, un bug visual, un contraste, confirmar un candidato ya usado por una página aprobada | [Ajuste](references/ajuste.md) |
| Hay que diseñar una página o pantalla concreta para desarrollo (mapa, búsqueda, contrato, obras, entidades, contratistas, alertas…) | [Construir una página](references/build-page.md): empieza por el contrato de la API; una página a la vez |
| Hace falta un **componente o token nuevo** | [Construir una página](references/build-page.md), paso 3: nace de la página que lo necesita |
| Hay que juzgar una ronda, la guía o Storybook | [Auditoría](references/audit.md) |
| Se aceptaron hallazgos de una auditoría, o se quiere cambiar la dirección del sistema (paleta, tipografía, lenguaje visual) | [Ronda](references/round.md); si se acepta, es la siguiente versión mayor |
| No hay brief, o cambió el negocio o la audiencia | [Descubrimiento](references/discover.md) |
| Piden «todo» | Descubrimiento → Auditoría → Ronda, con aprobación entre fases |

Anuncia la ruta elegida en una línea antes de empezar, con el motivo.

## Storybook: todo componente queda documentado

Storybook es la referencia visual viva; la guía HTML (`preview.html`, `examples.html`) y las rondas son seguimiento histórico y no se amplían.

- Todo componente que se crea o se modifica con esta skill termina con su historia en Storybook, en español y entendible para personas: para qué sirve, cuándo usarlo, qué evitar, accesibilidad, y una historia por estado (normal, «Sin datos» o vacío, error, carga, y 320 px si aplica).
- Componente React real: la historia va al lado, `src/**/ComponentName.stories.tsx`, con `tags: ['autodocs']`. El código va en inglés (componente, props, variables, archivos); el título (`Componentes/Núcleo/…` o `Componentes/Candidatos/…`), el `name` de las historias y las descripciones van en español. Si reemplaza una especificación de `.storybook/catalog/`, se retira esa especificación.
- Un cambio de tokens, principios o reglas se refleja en la página MDX correspondiente de `.storybook/docs/`.
- Validación mínima: `npm run build-storybook` sin errores, panel de accesibilidad sin fallas en claro y oscuro, y sin desbordamiento horizontal a 320 px.

## Siempre

- Textos de la interfaz en español (Colombia). La documentación nueva del proyecto, en español (regla de `AGENTS.md`).
- Las direcciones nuevas son rondas en `docs/design/rounds/NN-nombre-corto/`; nunca se sobrescribe una ronda anterior. La guía aceptada cambia solo por su proceso de cambio (`docs/design/guide/design-system.md#cambiar-el-sistema`): componentes y tokens aprobados, `build.py` pasando, versión actualizada y Storybook al día.
- Los diseños de página viven en `docs/design/pages/<pagina>/` y se construyen solo sobre **el contrato de nuestra API** (ingesta → base de datos/JSON → nuestra API → pantallas), los tokens de la guía y los componentes del catálogo. Sin contrato, no hay diseño.
- Marca los datos ficticios. Registra las fuentes externas con su fecha de consulta.
- No hagas commit, no publiques ni marques nada como aceptado sin la instrucción de una persona del equipo.

## Herramientas que llama este flujo

| Skill | Origen | Se usa en |
| --- | --- | --- |
| `design:design-critique`, `design:accessibility-review`, `design:ux-copy`, `design:design-system` | Plugin de diseño de Anthropic | Auditoría, Construir una página (validar), Ajuste (si toca textos o accesibilidad) |
| `dataviz` | Anthropic | Auditoría, Ronda (mapa, leyenda, gráficos) |
| `frontend-design` | Anthropic | Ronda |
| `impeccable` (`critique`, `audit`, `shape`, `polish`; CLI de detección) | [pbakaus/impeccable](https://github.com/pbakaus/impeccable), Apache-2.0, instalada en el proyecto para Claude (`.claude/skills`) y Codex/Antigravity (`.agents/skills`) sin hooks | Auditoría (segunda opinión, detector de antipatrones), Ronda (shape) |

Impeccable se instala **sin hooks** por decisión del equipo (2026-11-08): al instalarla o actualizarla, usa siempre `--no-hooks` y nunca agregues su hook a `.claude/settings*.json` ni a `.codex/hooks.json`; ejecuta su detector de forma explícita durante una auditoría. No ejecutes `impeccable init` ni `document`: escriben su propio PRODUCT.md / DESIGN.md. Nuestro brief y `docs/design/` son la única fuente; pásaselos a Impeccable como contexto. Agrega una skill de terceros solo después de leerla completa, revisar su licencia y obtener la aprobación del equipo; luego regístrala aquí.

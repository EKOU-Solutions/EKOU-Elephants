---
name: elephant-designer
description: Orquestador del diseño de EKOU Elephants. Cárgala ante cualquier pedido de cambio visual o de experiencia (pantallas, componentes, tokens, Storybook, mapa, textos de la interfaz), también cuando nadie activó un comando de diseño. Clasifica el pedido, lo lleva al flujo correcto (/crear-pantalla, /crear-componente, /revisar-implementacion, /ajuste, o auditoría, ronda y descubrimiento) y reparte el trabajo entre los roles elephant-data, elephant-ui, elephant-ux y elephant-tester.
---

# Elephant designer

Orquestador del diseño en este repositorio: conversa con el equipo, decide la experiencia y la composición, y reparte el trabajo entre los roles. Las otras skills de diseño (propias o de terceros) son herramientas que este flujo llama; aquí se decide cuándo, cómo y qué prevalece.

**Regla global (`AGENTS.md`):** todo cambio visual o de experiencia pasa por los flujos de diseño, por pequeño que sea. Si alguien pide un cambio sin activar un comando, se carga esta skill igual y se sigue el flujo que corresponda. Si piden saltárselo, no se hace: se explica que debe pasar por aquí.

## 1. Lee el contexto mínimo

Siempre, y solo esto al empezar: [`contexto.md`](contexto.md). Reúne la regla de lectura, las reglas fijas, dónde vive cada cosa y los comandos.

## 2. Elige el flujo

Clasifica el pedido y elige el flujo más corto que sea seguro. Si durante un flujo aparece algo de uno más profundo, para y escala.

| Situación | Flujo | Comando directo |
| --- | --- | --- |
| Cambio puntual que **mantiene la dirección**: un texto, un espaciado, un estado que falta, un bug visual, un contraste, un hallazgo aceptado de una revisión | [Ajuste](references/ajuste.md) | `/ajuste` |
| Una página o pantalla completa para desarrollo (mapa, búsqueda, contrato, entidades…) | [Construir una página](references/build-page.md): empieza por el contrato de la API; una página a la vez | `/crear-pantalla` |
| Un **componente nuevo**, o confirmar un candidato | [Crear un componente](references/component.md) | `/crear-componente` |
| Revisar algo ya construido: una página, un componente, un commit, una rama o los cambios sin confirmar | [Revisar una implementación](references/review.md) | `/revisar-implementacion` |
| Juzgar todo el sistema, una ronda o la guía | [Auditoría](references/audit.md) | — |
| Se aceptaron hallazgos de una auditoría, o se quiere cambiar la dirección (paleta, tipografía, lenguaje visual) | [Ronda](references/round.md); si se acepta, es la siguiente versión mayor | — |
| No hay brief, o cambió el negocio o la audiencia | [Descubrimiento](references/discover.md) | — |
| Piden «todo» | Descubrimiento → Auditoría → Ronda, con aprobación entre fases | — |

Anuncia el flujo elegido en una línea antes de empezar, con el motivo. Los comandos directos entran al mismo flujo sin pasar por esta clasificación; si a un comando le llega un pedido que no es suyo, lo devuelve aquí.

## 3. Sigue el flujo

Abre el archivo del flujo elegido y síguelo. Cada flujo dice al inicio qué más leer; la regla de lectura está en `contexto.md` («Cómo leer»).

## Roles

Tú diseñas y orquestas; `elephant-data`, `elephant-ui`, `elephant-ux` y `elephant-tester` hacen el resto. Qué hace cada uno y cómo repartir el trabajo: [roles](references/roles.md).

## Precedencia

1. Decisiones explícitas de las personas del equipo registradas en `docs/design/` (dirección visual, brief, guía).
2. El brief de descubrimiento.
3. Las reglas de esta skill.
4. Los consejos de skills de terceros (Impeccable, etc.).

Un hallazgo de terceros que contradiga 1 o 2 se reporta como pregunta para el equipo; nunca se aplica en silencio. Fijo hasta que TASK-07 decida otra cosa: roles de riesgo azul / amarillo / rojo cálido, trama gris para datos faltantes, ningún umbral de riesgo inventado, «señal, no veredicto».

## En todos los flujos

- **Storybook es la referencia viva.** Todo componente o pantalla que se crea o se modifica termina con su historia al lado, en español y con una historia por estado. La guía HTML (`preview.html`, `examples.html`) y las rondas son seguimiento histórico y no se amplían.
- **La validación mecánica es un comando:** `npm run design:check` (con `--filter` para acotar). No revises a mano lo que el comando ya comprueba; usa sus capturas para juzgar lo visual.
- **Cambios del sistema:** las direcciones nuevas son rondas; la guía aceptada cambia solo por su [proceso de cambio](../../../docs/design/guide/design-system.md#cambiar-el-sistema). Un cambio de tokens, principios o reglas se refleja en su página MDX de `.storybook/docs/`.
- **Reporta** qué cambió, qué se verificó y qué no. Sin commit ni «aceptado» sin instrucción del equipo; la única excepción es el commit del componente al final de `/crear-componente`.

Otras skills que llama el flujo y cómo se instalan: [herramientas](references/herramientas.md). Qué hace cada comando, explicado para personas: [`docs/design/comandos.md`](../../../docs/design/comandos.md).

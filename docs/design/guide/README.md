# Guía del sistema de diseño v1.0

Estado: **Aceptada** (2026-11-08). Tarea: [#6](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/6). Origen: [Ronda 05: referencia del sistema](../rounds/05-system-reference/README.md). Registro de la decisión: [dirección visual](../visual-direction.md#selección-final-2026-11-08).

Este fue el entregable de TASK-05: una guía en HTML, documentación para desarrollo y agentes de IA, y la skill `elephants-design`, que construye cada página final a partir de su contrato de API. El 2026-11-08 se descartó Storybook.

> **Actualización 2026-11-15:** se revirtió esa decisión. La referencia visual viva es Storybook (`npm run storybook`). Esta carpeta conserva la fuente de verdad de tokens y catálogo (`tokens.json`, `components.css`, `components.json`, `build.py`), que Storybook importa. La página de referencia `preview.html` y los ejemplos `examples.html` quedan como seguimiento histórico de la v1.0: no se amplían con componentes nuevos.

## Empieza aquí

| Si eres | Lee |
| --- | --- |
| Desarrollo o un agente de IA que implementa interfaz | Storybook (`npm run storybook`), [design-system.md](design-system.md) (reglas), `tokens.css` (impórtalo), [components.json](components.json) (catálogo), `tokens.md` (tabla de tokens) |
| Diseño, o el equipo que revisa lo visual | Storybook: lineamientos, fundamentos y componentes en tema claro y oscuro |
| Quien diseña una página nueva | [Flujo de diseño](../design-flow.md) y la ruta [Construir una página](../../../.claude/skills/elephants-design/references/build-page.md) de la skill |
| Quien quiere ver la referencia histórica v1.0 | `preview.html` y `examples.html` (pantallas en celular y portátil), después de generarlas |

```sh
python3 docs/design/guide/build.py
open docs/design/guide/preview.html docs/design/guide/examples.html
```

## Qué contiene la v1.0

- La **maquetación editorial** de la Ronda 05: superficie neutra, líneas en lugar de tarjetas, el dato primero.
- **Una sola tipografía: Public Sans 5.3.0**, alojada con la aplicación. Se quitaron el selector A/B de tipografía y los archivos de Source Sans 3 / Source Serif 4.
- Tema claro y oscuro. Los 17 pares de contraste pasan en ambos.
- 8 componentes del núcleo y 6 candidatos (ver `components.json`). Al aceptarse eran 9 y 5; ver «Cambios después de la aceptación».
- Tres pantallas de ejemplo (detalle de contrato, lista de resultados, mapa con panel de territorio) dentro de simuladores de iPhone y MacBook.

Qué cambió frente a la Ronda 05, y por qué:

- **Correcciones trasladadas:**
  - El enlace de «pantalla completa» del celular ahora abre la pantalla a 390 px (`screens/phone.html`).
  - El simulador de portátil ya no se desborda a 320 px.
- **Quitado:** la pantalla de obra. Si una obra es una entidad distinta de un contrato se decidirá cuando se defina el modelo de negocio con Esteban, y su página pasará por Construir una página.
- **Agregado:**
  - `components.json` y `design-system.md`.
  - Un `tokens.md` generado.
  - Comprobaciones en el build de que cada clase y cada token del catálogo existen.
- **No adoptado:** la capa visual de la Ronda 06 (lienzo con tarjetas blancas, controles en píldora). Ver el registro de la decisión.

## Cambios después de la aceptación

| Versión | Fecha | Cambio | Decisión |
| --- | --- | --- | --- |
| 1.0.1 | 2026-11-15 | El Mapa con leyenda pasa de núcleo a candidato: la página del Mapa lo confirma o lo ajusta | Jouler |

## Archivos

`tokens.json` (fuente de verdad) → `build.py` → `tokens.css`, `tokens.md` y `contrast-report.json`, todos versionados y generados. También escribe `preview.html`, `examples.html` y `screens/`, que se ignoran en git y funcionan sin conexión: la fuente va incrustada y el script de Lucide va en línea. Las otras fuentes son `source.html`, `examples.source.html`, `examples/`, `components.css` y `components.json`. La carpeta `assets/` guarda la fuente con su licencia OFL, Lucide 0.468.0 con su licencia ISC, los trazos del mapa y los territorios ficticios.

La guía anterior (v0.1, basada en la Ronda 02) se conserva como historia en [`../archive/guide-v0.1/`](../archive/guide-v0.1/README.md).

## Fuentes (consultadas el 2026-11-08)

- Tipografía: [`@fontsource-variable/public-sans@5.3.0`](https://cdn.jsdelivr.net/npm/@fontsource-variable/public-sans@5.3.0/), OFL-1.1.
- Íconos: [Lucide 0.468.0](https://lucide.dev), ISC.
- Geografía: geoBoundaries COL ADM1 / OpenStreetMap, ODbL 1.0; procedencia en la [Ronda 01](../rounds/01-territory-overview/README.md#geografía-y-atribución). Todos los valores son ficticios.

## Abierto (fuera de esta guía)

- Umbrales y categorías de riesgo: TASK-07.
- Datos personales: TASK-08.
- Obra frente a contrato como entidades: se decide cuando se defina el modelo de negocio.
- Implementación de producción: el marcado de aquí es una especificación, no una biblioteca de componentes probada.

Validación: [validation.md](validation.md).

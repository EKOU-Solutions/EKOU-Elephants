# Contexto mínimo de diseño

Lo que cualquier flujo, comando o rol necesita antes de tocar diseño. Es un índice: cada regla es una línea y enlaza su fuente. Si una línea y su fuente no coinciden, gana la fuente; repórtalo.

## Cómo leer

**Lee solo lo que necesitas, cuando lo necesitas.** Al empezar: este archivo, el archivo de tu flujo o de tu rol, y lo que ese archivo liste en «Lee». Un enlace dentro de un documento es una referencia, no una orden de abrirlo: ábrelo solo cuando el paso en el que estás lo necesite. De un documento largo, lee la sección que aplique. No leas nada «por si acaso», y no le preguntes al equipo lo que estos archivos ya responden.

## Reglas de producto

Fuente: [brief](../../../docs/design/discovery/brief.md) y [reglas que no se negocian](../../../docs/design/guide/design-system.md#reglas-que-no-se-negocian).

- **Señal, no veredicto.** La interfaz nunca dice «corrupción», «robo» ni «sospechoso». La fuerza viene del hecho y de la cifra.
- **Sin nombres de personas naturales** en ningún artefacto hasta que TASK-08 decida. Empresas y entidades públicas sí.
- **El nivel de riesgo no se inventa.** `low` / `medium` / `high` salen de la metodología (TASK-07); no hay umbrales propios.
- **«Sin datos» no es cero** ni riesgo bajo: trama gris y las palabras «Sin datos».
- **Toda cifra lleva fuente y fecha.** Los datos ficticios o de muestra se marcan como tales.
- **Sin contrato, no hay diseño.** Una página se diseña solo sobre el contrato de nuestra API, nunca sobre la fuente cruda.

## Reglas de diseño

Fuente: [`design-system.md`](../../../docs/design/guide/design-system.md).

- **Solo tokens** `var(--el-*)`: ningún hex, fuente ni medida suelta que un token cubra.
- **Solo el catálogo.** Si falta un componente, se crea con `/crear-componente`; no se improvisa.
- **El dato primero:** superficies neutras, líneas en lugar de tarjetas, sin sombras ni degradados. El color fuerte es para los datos.
- **El color nunca va solo:** el riesgo lleva texto e indicador de barras, leyenda o tabla equivalente.
- **Celular primero:** funciona a 320 px sin desplazamiento horizontal, controles de 44 px, nada depende del hover.
- **Dos temas:** claro y oscuro, siempre.
- **Accesibilidad:** WCAG 2.2 AA, elementos nativos, foco visible.
- **Movimiento reducido, siempre:** toda animación o transición respeta `prefers-reduced-motion` (el ajuste global está en `src/styles/global.css`). Nada parpadea ni se mueve solo sin forma de pausarlo, y ningún contenido depende de una animación para entenderse.
- **Formato de cifras** (es-CO, pesos, porcentajes, fechas): [contrato de presentación de datos](../../../docs/design/guide/design-system.md#contrato-de-presentación-de-datos).

## Audiencia

Público general en celular de gama media y con datos limitados, que llega por un enlace compartido. Prueba de 10 segundos: entiende dónde se concentran las señales, qué significa el color y que no es una acusación. Detalle: [brief](../../../docs/design/discovery/brief.md).

## Dónde vive cada cosa

| Qué | Carpeta | Título en Storybook |
| --- | --- | --- |
| Componente UI: puro y transversal | `src/components/ui/<Component>/` | `Componentes/UI/<Component>` |
| Componente de un módulo (organismo: panel, sección, mapa) | `src/modules/<módulo>/ui/<Component>/` | `Módulos/<Módulo>/<Component>` |
| Pantalla de un módulo | `src/modules/<módulo>/ui/<Page>Page/` | `Módulos/<Módulo>/<Page>Page` |
| Candidatos que aún no son React | `.storybook/catalog/candidates/` | `Componentes/Candidatos/<Component>` |
| Tokens (fuente) y catálogo | `docs/design/guide/tokens.json`, `components.json` | — |
| Diseño de cada página | `docs/design/pages/<pagina>/` | — |

Storybook refleja el módulo: la pantalla y sus componentes quedan juntos en `Módulos/<Módulo>/`. Cada componente tiene su carpeta con `Component.tsx`, `Component.module.css` y `Component.stories.tsx`. Detalle y plantilla de historia: `.storybook/docs/HowWeWork.mdx`.

## Comandos

| Comando | Para qué |
| --- | --- |
| `npm run storybook` | Ver Storybook en http://localhost:6006 |
| `npm run design:check` | Validación automática: guía (`build.py`), build de Storybook, y por cada historia × tema × ancho (320, 390, 768, 1280 px): render, axe y desplazamiento horizontal. Guarda capturas en `.design-check/screenshots/` |
| `npm run design:check -- --filter <texto>` | Lo mismo, solo para las historias cuyo id o título contiene el texto (`--filter mapa`) |
| `python3 docs/design/guide/build.py` | Regenera `tokens.css` y comprueba contraste y catálogo |
| `npm run check` | Lint, formato, tipos, pruebas y build de la app |

Pruebas visuales (comparar capturas contra la versión anterior): se harán con una herramienta de código abierto y alojada por nosotros, sobre Storybook (decisión del equipo, 2026-11-16; Chromatic se descartó por cobrar por captura). La herramienta está por elegir; todavía no hay pruebas visuales.

Para ver el catálogo sin leer todo `components.json`:

```sh
node -p "require('./docs/design/guide/components.json').components.map(c => c.status + '  ' + c.name + ': ' + c.use).join('\n')"
```

## Comandos de diseño

`/crear-pantalla`, `/crear-componente`, `/revisar-implementacion` y `/ajuste`; para lo demás o si hay duda, `/elephant-designer`. Roles: `elephant-data`, `elephant-ui`, `elephant-ux`, `elephant-tester`.

## Límites

- Código en inglés; textos de la interfaz, historias y documentos en español (Colombia).
- No edites archivos generados (`tokens.css`, `tokens.md`, `preview.html`).
- No hagas commit, no publiques ni marques nada como aceptado sin la instrucción de una persona del equipo.
- Una decisión registrada ([dirección visual](../../../docs/design/visual-direction.md), brief, TASK-07, TASK-08) no se cambia en silencio: se pregunta.

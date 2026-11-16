---
name: elephant-ui
description: Rol del flujo de diseño de EKOU Elephants. Implementa en React un componente o una pantalla ya definidos (componente, CSS Module, historias y datos de muestra) y los deja pasando npm run design:check. Úsalo cuando haya una especificación aprobada o un ajuste ya clasificado por elephant-designer. No decide diseño.
---

# Implementer UI

Rol del flujo [`elephant-designer`](../elephant-designer/SKILL.md), que es el orquestador. También se puede llamar solo (`/elephant-ui <qué construir>`), pero solo con una especificación aprobada o un ajuste ya clasificado. Si no hay ninguno de los dos, el pedido va primero por `/elephant-designer`.

## Recibe

- **Qué construir:** un componente o una pantalla por encargo (una carpeta).
- **La definición:** las filas de `spec.md` que le tocan, o la definición del componente (propósito, anatomía, variantes, estados, comportamiento, tokens, accesibilidad) con las variantes por mostrar o la variante elegida, o el ajuste pedido.
- Para una pantalla: el boceto elegido y el orden de lectura acordado (qué se ve primero, segundo y tercero).

## Lee

1. [`contexto.md`](../elephant-designer/contexto.md).
2. [Ponytail](references/ponytail/ponytail.md), en nivel `full`: el menor código que resuelve todo el encargo. Y [calidad del código](references/react.md): cómo debe quedar ese código. Los dos, completos, antes de escribir.
3. `.storybook/docs/HowWeWork.mdx` (dónde vive un componente y la plantilla de historia).
4. Los componentes que va a usar: su código en `src/components/ui/<Component>/`.
5. Para una pantalla: el paso 4 de [Construir una página](../elephant-designer/references/build-page.md) y los tipos del contrato.

## Hace

1. Crea o edita **solo su carpeta**: `Component.tsx`, `Component.module.css`, `Component.stories.tsx` y, en una pantalla, `<Page>Page.fixtures.ts`.
2. Compone con los componentes UI del catálogo. Estilos propios en su CSS Module, solo con tokens `--el-*`.
3. Una historia por estado: normal, carga, vacío, «Sin datos», error y un caso extremo. Título según `contexto.md` (`Componentes/UI/…` o `Módulos/<Módulo>/…`).
4. Si algo se anima, respeta `prefers-reduced-motion`. Implementa el comportamiento de la especificación (qué pasa en cada toque, foco, URL del estado) sin agregar otro.
5. Respeta la jerarquía visual acordada: el orden de lectura de la pantalla es el de la especificación. No agregues elementos que no estén en ella.
6. Si es un componente nuevo o confirmado, actualiza `docs/design/guide/components.json`.
7. Valida: `npm run design:check -- --filter <componente o módulo>`, `npm run typecheck` y `npm test`. Corrige hasta que pasen.

## Devuelve

Máximo 30 líneas: archivos creados o cambiados, lo que dejó sin hacer a propósito por no ser necesario (una línea), la línea de resumen de `design:check`, el resultado de tipos y pruebas, y las dudas o decisiones que tomó por su cuenta.

## Límites

- **Mínimo, pero bien hecho.** No agrega opciones, abstracciones ni dependencias que nadie pidió; tampoco recorta lo que el flujo exige (historias por estado, accesibilidad, pruebas de la lógica).
- **No decide diseño.** Si la definición es ambigua o falta un componente o un token, se detiene y pregunta; no improvisa.
- No toca otras carpetas de componentes, los tokens ni archivos generados.
- No llama a la API desde una pantalla: los datos llegan por props.
- No hace commit.

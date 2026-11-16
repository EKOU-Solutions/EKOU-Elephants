# Diseño

Fuente de verdad, dentro del repositorio, de la dirección visual, el sistema de diseño y las rondas de revisión de [TASK-05](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/6).

Toda persona o agente, de cualquier proveedor, lee este índice y la [dirección visual](visual-direction.md) antes de hacer cambios. Todo cambio de diseño pasa por la skill `elephant-designer` (regla global de `AGENTS.md`). Las vistas previas se generan a partir de archivos del repositorio. Los adjuntos de chat y los lienzos de los proveedores son vistas de esos archivos, no la fuente canónica. No publiques, no hagas commit ni marques una propuesta como aceptada sin la instrucción del equipo.

## Dirección actual

**Aceptada el 2026-11-08:**
- La dirección editorial de la [Ronda 05](rounds/05-system-reference/README.md), con **Public Sans**. Pone el dato primero: superficies neutras, líneas en lugar de tarjetas, cifras grandes con fuente y fecha.
- Azul, amarillo y rojo cálido para riesgo bajo, intermedio y alto. Trama gris para los datos faltantes.
- No se seleccionó la capa más limpia, estilo Apple, de la [Ronda 06](rounds/06-clean-layer/README.md): el producto se centra en los datos.

Registro de la decisión: [dirección visual](visual-direction.md#selección-final-2026-11-08). Los umbrales y el método de riesgo siguen en TASK-07.

## Referencia de la interfaz

**Storybook es la referencia visual viva** del sistema de diseño (`npm run storybook`; ver [desarrollo](../desarrollo.md#sistema-de-diseño-storybook)). Reúne los lineamientos para personas, los fundamentos, la accesibilidad y todos los componentes que se crean con la skill `elephant-designer`. Desde el 2026-11-15 revierte la decisión del 2026-11-08 de descartar Storybook.

La [guía del sistema de diseño v1.0](guide/README.md) sigue siendo la fuente de verdad que Storybook importa:
- tokens (`tokens.json` es la fuente de verdad; `tokens.css` se genera);
- componentes (`components.json`; los del núcleo son React en `src/components/ui/` con sus propios estilos, y los candidatos siguen como especificación en `components.css`);
- [reglas para desarrollo y agentes de IA](guide/design-system.md).

Su página HTML de referencia y las pantallas de ejemplo en simuladores de celular y portátil (`preview.html`, `examples.html`) quedan como seguimiento histórico, igual que las rondas. La [guía v0.1](archive/guide-v0.1/README.md) anterior está archivada.

## Diseñar páginas para desarrollo

Las páginas se diseñan de a una. Cada una parte del **contrato de nuestra API**: la ingesta guarda los datos en la base de datos o en archivos JSON, y nuestra API los sirve a las pantallas. Ver:
- el [flujo de diseño](design-flow.md), con diagramas, para desarrollo;
- los [diseños de página](pages/README.md): el registro de páginas y una referencia tentativa.

Los agentes usan el comando `/crear-pantalla`. Qué hace cada comando de diseño: [comandos](comandos.md).

## Trabajar en rondas

Las rondas sirven para cambiar el sistema mismo (una dirección nueva o una versión mayor), no para diseñar páginas. Los cambios pequeños que mantienen la dirección usan la ruta *Ajuste* de la skill.

- Los agentes usan la skill del proyecto `elephant-designer` (`.claude/skills/`, enlazada para Codex y Antigravity en `.agents/skills/`). Clasifica el pedido (ajuste, construir una página, auditoría, ronda o descubrimiento) y llama a las otras skills de diseño, incluida la skill de terceros `impeccable`, instalada en el proyecto.
- Cada ronda vive en `rounds/NN-nombre-corto/`, con un README que cubre propósito, estado, decisiones, fuentes, cómo reproducirla y validación.
- La fuente editable y los recursos pequeños que necesita viven dentro de la ronda. Marca los datos ficticios y registra de dónde vienen los recursos externos.
- Revisa la ronda actual mientras explore la misma hipótesis. Una dirección materialmente distinta empieza una ronda nueva, enlazada a la anterior.
- Registra los comentarios y la aceptación en el README de la ronda. Separa las decisiones aceptadas de las propuestas y las preguntas abiertas. Nunca reemplaces en silencio una ronda aceptada.
- Toda la documentación y los textos de la interfaz se escriben en español para el público colombiano (regla de `AGENTS.md`). Los identificadores de código y los nombres que exigen las herramientas se conservan.
- Las vistas previas generadas son desechables; se reconstruyen desde las fuentes versionadas.

## Registro de revisiones

| Ronda | Hipótesis | Estado |
| --- | --- | --- |
| [01](rounds/01-territory-overview/README.md) | Acentos de EKOU contenidos dejan los datos geográficos como foco visual principal | Tipografía aceptada; semántica del mapa y tratamiento de errores reemplazados |
| [02](rounds/02-risk-signals/README.md) | Base azul, señales ámbar/rojas y errores explícitos y recuperables | Seleccionada tras comparar; base de los roles de color del riesgo |
| [03](rounds/03-warm-risk-map/README.md) | Escala cálida continua inspirada en Transparencia; mapa editorial y resumen del territorio | No seleccionada: el mapa todo cálido se sentía caótico |
| [04](rounds/04-grounded-guide/README.md) | Guía guiada por el mapa, estilo libro contable, con voz en lenguaje claro; tipografía comparada con la fuente del sistema | Revisada: estructura poco clara para construir; se mantiene la trama; Atkinson rechazada para cifras |
| [05](rounds/05-system-reference/README.md) | Referencia de documentación de componentes para dev/UX/UI, fuente alojada, rellenos de riesgo ordenados, tema claro y oscuro, `tokens.css`, etiquetas de riesgo rellenas, ejemplos en celular y portátil | **Seleccionada (final)** el 2026-11-08 con Public Sans → [guía v1.0](guide/README.md) |
| [06](rounds/06-clean-layer/README.md) | Capa limpia: lienzo + tarjetas blancas, controles en píldora, texto introductorio; propuesta obra ↔ contratos | No seleccionada: más limpia e invita a explorar, pero menos centrada en los datos; se trasladaron las correcciones de errores |

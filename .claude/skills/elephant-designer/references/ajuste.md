# Ajuste

**Lee** (además de [`contexto.md`](../contexto.md)): El archivo que vas a tocar y su historia. De `docs/design/guide/design-system.md`, solo la sección que aplique. Si tocas textos, «Voz del riesgo» de `docs/design/discovery/brief.md`.

Ruta corta para cambios que **mantienen la dirección visual**: un texto de la interfaz, un espaciado, un estado que falta, un bug visual, un problema de contraste, o confirmar un componente candidato que una página aprobada ya usa. Es corta, no opcional: se cumplen todos los pasos.

## 1. Clasificar (y escalar si hace falta)

Antes de tocar nada, confirma que el pedido es un ajuste. Para y cambia de ruta si:

- hace falta un componente o un token **nuevo** → `/crear-componente` ([Crear un componente](component.md));
- cambia la paleta, la tipografía o el lenguaje visual → [Ronda](round.md);
- es una página o pantalla nueva, o cambia el contrato de la API que la alimenta → `/crear-pantalla` ([Construir una página](build-page.md));
- solo quieren revisar, sin cambiar nada → `/revisar-implementacion`;
- contradice una decisión registrada (`visual-direction.md`, el brief o las reglas fijas de TASK-07/TASK-08) → pregunta al equipo.

Anuncia en una línea: «Ruta: Ajuste — motivo».

## 2. Revisar contra el sistema

- Identifica qué se toca: historia de Storybook, componente React en `src/` (con su `.module.css`), un candidato en `components.css`, `tokens.json` o una página de `.storybook/docs/`.
- Comprueba que el resultado use solo tokens `--el-*`, que cada componente siga con sus propios estilos (sin clases compartidas), y que respete las reglas no negociables (`design-system.md`): color nunca solo, «Sin datos» no es cero, señal y no veredicto, celular primero, dos temas.
- Si toca textos, revisa el tono (`design:ux-copy`): frase corta, verbo activo, número concreto, fuente y fecha cerca del dato.

## 3. Aplicar

- Haz el cambio mínimo en la fuente de verdad, nunca en un archivo generado (`tokens.css`, `preview.html`).
- Si cambia `tokens.json`, `components.css`, `components.json` o el CSS Module de un componente: ejecuta `python3 docs/design/guide/build.py` (falla si el contraste o el catálogo no cuadran), sube la versión de parche o menor y anota el cambio en `docs/design/guide/README.md`.
- Actualiza la historia de Storybook afectada (o créala si faltaba) y la página MDX si cambia una regla.

## 4. Validar

- `npm run design:check -- --filter <componente o módulo>` sin fallas: comprueba el render, axe y el desplazamiento horizontal de cada historia a 320, 390, 768 y 1280 px, en claro y oscuro. Si cambiaste un token o un componente UI que usan otras historias, ejecuta el barrido completo (sin `--filter`).
- Mira la captura del cambio en `.design-check/screenshots/` (al menos 320 px, claro y oscuro): confirma que se ve como se pidió.
- `npm run typecheck` y `npm test` si se tocó código en `src/`.

## 5. Reportar

Qué cambió, por qué era un ajuste, qué se verificó y qué no. No hagas commit ni marques nada como aceptado sin la instrucción del equipo.

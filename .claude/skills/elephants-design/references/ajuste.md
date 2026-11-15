# Ajuste

Ruta corta para cambios que **mantienen la dirección visual**: un texto de la interfaz, un espaciado, un estado que falta, un bug visual, un problema de contraste, o confirmar un componente candidato que una página aprobada ya usa. Es corta, no opcional: se cumplen todos los pasos.

## 1. Clasificar (y escalar si hace falta)

Antes de tocar nada, confirma que el pedido es un ajuste. Para y cambia de ruta si:

- hace falta un componente o un token **nuevo** → [Construir una página](build-page.md), paso 3;
- cambia la paleta, la tipografía o el lenguaje visual → [Ronda](round.md);
- es una página o pantalla nueva, o cambia el contrato de la API que la alimenta → [Construir una página](build-page.md);
- contradice una decisión registrada (`visual-direction.md`, el brief o las reglas fijas de TASK-07/TASK-08) → pregunta al equipo.

Anuncia en una línea: «Ruta: Ajuste — motivo».

## 2. Revisar contra el sistema

- Identifica qué se toca: historia de Storybook, componente React en `src/`, `components.css`, `tokens.json` o una página de `.storybook/docs/`.
- Comprueba que el resultado use solo tokens `--el-*` y clases del catálogo, y que respete las reglas no negociables (`design-system.md`): color nunca solo, «Sin datos» no es cero, señal y no veredicto, celular primero, dos temas.
- Si toca textos, revisa el tono (`design:ux-copy`): frase corta, verbo activo, número concreto, fuente y fecha cerca del dato.

## 3. Aplicar

- Haz el cambio mínimo en la fuente de verdad, nunca en un archivo generado (`tokens.css`, `preview.html`).
- Si cambia `tokens.json`, `components.css` o `components.json`: ejecuta `python3 docs/design/guide/build.py` (falla si el contraste o el catálogo no cuadran), sube la versión de parche o menor y anota el cambio en `docs/design/guide/README.md`.
- Actualiza la historia de Storybook afectada (o créala si faltaba) y la página MDX si cambia una regla.

## 4. Validar

- `npm run build-storybook` sin errores.
- La historia en tema claro y oscuro, a 320 px sin desplazamiento horizontal, y con el panel de accesibilidad sin fallas.
- `npm run typecheck` y `npm test` si se tocó código en `src/`.

## 5. Reportar

Qué cambió, por qué era un ajuste, qué se verificó y qué no. No hagas commit ni marques nada como aceptado sin la instrucción del equipo.

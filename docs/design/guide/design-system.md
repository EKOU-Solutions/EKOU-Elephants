# Sistema de diseño de Elephants v1.3: reglas para desarrollo y agentes de IA

Aceptado el 2026-11-08: la dirección editorial de la [Ronda 05](../rounds/05-system-reference/README.md) con **Public Sans**. Este archivo es la versión corta y normativa de la guía. La referencia visual viva es Storybook (`npm run storybook`), que carga los mismos tokens que la app y muestra las mismas reglas con ejemplos interactivos. Si este archivo y Storybook no coinciden, repórtalo; no elijas uno en silencio.

Todo cambio de diseño pasa por la skill `elephants-design` (regla global de `AGENTS.md`). Cada componente nuevo o modificado se documenta con su historia en Storybook. La página HTML `preview.html` queda como seguimiento histórico de la v1.0.

## Archivos

| Archivo | Rol | ¿Se edita? |
| --- | --- | --- |
| `tokens.json` | **Fuente de verdad** de colores (claro y oscuro), tipografía, espaciado y geometría | Sí, solo mediante un cambio (ver abajo) |
| `tokens.css` | Propiedades personalizadas de CSS generadas a partir de `tokens.json`. `build.py` también la copia, con la fuente, a `src/styles/`, de donde la importan la app y Storybook | No, se genera |
| `tokens.md` | Tabla de tokens generada para lectura | No, se genera |
| `contrast-report.json` | Contraste de cada par de texto, control, foco, trama y etiqueta de riesgo, en ambos temas | No, se genera |
| `components.css` | Clases `.el-*` de la v1.0. Hoy solo las usan los **candidatos** (especificación) y la referencia HTML histórica; la app no lo importa | Solo para candidatos; se vacía a medida que se implementan |
| `components.json` | Catálogo legible por máquinas: estado, variantes, tokens, accesibilidad y, para los componentes React, su archivo (`component`) y sus estilos (`styles`) | Sí |
| `source.html`, `examples.source.html`, `examples/` | Fuentes de la página de referencia histórica y de las pantallas de ejemplo (textos del producto en español) | Solo para correcciones; no se amplían |
| `build.py` | Regenera todo; falla si el contraste no pasa, si `components.json` nombra un archivo, una clase o un token que no existe, o si un componente React declara clases compartidas | Sí |
| `preview.html`, `examples.html`, `screens/` | Generados, sin conexión, ignorados en git | No |

```sh
python3 docs/design/guide/build.py
```

## Reglas que no se negocian

1. **Solo tokens.** Usa `var(--el-*)` en todo. Nunca un hex, un nombre de fuente o un valor en píxeles que un token ya cubra.
2. **Solo el catálogo.** Arma las pantallas con las entradas de `components.json` (documentadas en Storybook). Un componente con `"status": "candidate"` se puede usar, pero la primera página que lo necesite lo confirma o lo descarta. Si nada sirve, no improvises: propón un componente por la ruta [Construir una página](../../../.claude/skills/elephants-design/references/build-page.md).
3. **El dato es lo primero.** Superficies neutras, líneas en lugar de tarjetas, sin sombras, degradados ni brillos. El color fuerte se reserva para los datos.
4. **El color nunca va solo.** Todo color de riesgo va con una etiqueta de texto y el glifo de 1/2/3 barras, una leyenda o una tabla con los mismos valores.
5. **«Sin datos» no es cero.** El análisis faltante usa la trama gris (`--el-color-unknown` sobre `--el-color-unknown-surface`) y las palabras «Sin datos». Nunca es 0 % ni riesgo bajo.
6. **Una señal, no un veredicto.** La interfaz nunca dice «corrupción», «robo» ni «sospechoso». No muestra nombres de personas naturales hasta que TASK-08 lo decida.
7. **El nivel de riesgo no se elige a mano.** `low` / `medium` / `high` salen de la metodología (TASK-07). La guía no define umbrales.
8. **Celular primero.** Todo funciona a 320 px sin desplazamiento horizontal. Los controles miden al menos 44 px de alto. Nada depende del hover.
9. **Dos temas.** Cada pantalla se revisa en claro y en oscuro. El tema oscuro sigue `prefers-color-scheme`; se puede forzar con `data-theme="light|dark"` en `<html>`.

## Roles de color

| Rol | Tokens | Regla |
| --- | --- | --- |
| Riesgo (mapa, etiquetas) | `risk-low`, `risk-medium`, `risk-high`, más `on-risk-*` para el texto | Azul → amarillo → rojo cálido, ordenados de claro a oscuro para que el orden se lea sin el tono. Solo datos |
| Datos faltantes | `unknown`, `unknown-surface` | Trama gris, siempre con «Sin datos» |
| Texto | `text`, `text-muted` | Texto principal y secundario; ambos pasan 4,5:1 |
| Estructura | `line`, `line-strong`, `control-border`, `map-border` | Las líneas organizan el contenido; los controles llevan un borde de 3:1 |
| Acción | `action`, `action-hover`, `on-action`, `action-soft`, `focus` | Enlaces, botones, anillo de foco. Nunca para riesgo |
| Mensajes | `warning`, `danger`, `success` y sus versiones `-soft` | Solo mensajes de la interfaz. `success` confirma una acción y nunca califica un territorio como seguro |

Excepción registrada (revisión de la Ronda 05): en la barra de avance «pagado frente a lo esperado», la marca de lo esperado usa `risk-high` como alerta.

## Tipografía

- Una sola familia: **Public Sans 5.3.0** (OFL-1.1), alojada desde `assets/fonts/`. Pila de respaldo en `tokens.json`. Sin CDN.
- Escala (`--el-size-*`): display 40, title 30 (26 en celular), section 22, subsection 18, body 16, small 14, figure 48 (40 en celular).
- Pesos: 400 para texto, 600 para énfasis, 700 para títulos y cifras. Interlineado: 1,5 en texto, 1,2 en títulos, 1,05 en cifras.
- Los números usan `font-variant-numeric: tabular-nums lining-nums` (`--el-numbers`).

## Espacio y forma

- Escala de espaciado: 4, 8, 12, 16, 24, 32, 48 px (`--el-space-*`). Usa 8–12 entre elementos relacionados y 24–32 entre grupos.
- Controles: alto 44, radio 6. Marcas de datos: radio 2. Líneas: 1 px, o 2 px (`--el-rule-strong` con `line-strong`) encima de cifras clave y encabezados de tabla.
- Foco: anillo de 3 px con 3 px de separación. Nunca se quita.

## Íconos

Lucide 0.468.0, trazo de 2 px. En React se piden por nombre con `Icon` (`<Icon name="search" />`); el conjunto aprobado y el proveedor de cada ícono viven solo en `src/components/ui/Icon/icons.ts`. Tamaños: 20 px junto a texto, 24 px en alertas. Un ícono decorativo lleva `aria-hidden="true"`. Un botón que solo tiene ícono necesita `aria-label`. Sin emojis, sin imágenes criminales, sin escudo verde de «seguro».

## Contrato de presentación de datos

| Elemento | Regla | Ejemplo |
| --- | --- | --- |
| Proporción con señales | Contratos distintos con señales ÷ contratos analizados × 100. Siempre se muestran los dos conteos | 30%, «36 de 120 contratos analizados» |
| Cobertura | Analizados ÷ disponibles, aparte del riesgo | 80%, «120 de 150 disponibles» |
| Desconocido | Un denominador en cero significa que no hay dato | «Sin datos», nunca 0% |
| Cero real | Se muestra 0 cuando se midió, y se dice qué se evaluó | «0 de 100 analizados» |
| Conteo | Entero, punto como separador de miles, siempre con sustantivo | 2.500 contratos |
| Dinero | Pesos con la escala en palabras. En filas densas, `M` puede significar millones. Aclarar si el monto es firmado, vigente, pagado o presupuestado | $ 2.300 millones; $ 4.800 M |
| Porcentaje | Máximo un decimal, coma decimal (`es-CO`); se calcula con valores sin redondear | 12,5% |
| Cambio | Puntos porcentuales, no cambio relativo | +4 p. p. |
| Fecha | La fecha de actualización del dato, separada del periodo consultado | «actualizado el 31 dic 2025»; periodo 2025 |
| Fuente | Toda cifra lleva cerca su fuente y su periodo | «SECOP II · 2025» |

Un contrato con varias señales cuenta una sola vez en el numerador. Nunca se clasifica a partir de un valor redondeado para mostrar.

## Componentes

`components.json` es la lista completa y Storybook los documenta uno por uno. **Núcleo** (aceptados con la Ronda 05): Botón, Alerta (bloque, banner, nota en línea), Campo de texto (`Input`) y Lista (`Select`), los dos sobre la base `FormField`, Ícono (`Icon`), Etiqueta de riesgo, Contador, Filtro activo, Cifra destacada, Tabla de datos, Mapa con leyenda y Resultados de búsqueda. **Candidatos** (pendientes de confirmación por una página real): Estado, Barra de progreso (`ProgressBar`: cobertura y desglose), Desglose en barras, Avance frente a lo esperado, Señal. El Mapa con leyenda entró al núcleo con la Ronda 05 y pasó a candidato el 2026-11-15 por decisión de Jouler: lo confirma o lo ajusta la página del Mapa. La página del Mapa (TASK-09, aprobada el 2026-11-15) lo devolvió al núcleo en la v1.3.0 con una **variante neutra** para la capa de lugares mientras no exista el riesgo: un solo relleno (`--el-color-line`), contorno del conjunto y contorno al pasar o enfocar en `--el-color-control-border`, nombres de lugar de 14 px solo para la selección y las referencias clave, y botones de zoom de 44 px. En la misma versión entró **Resultados de búsqueda**: hasta 8 lugares con su departamento, bajo un campo de búsqueda. Los dos todavía están solo como clases de la guía (`components.css`); su componente React con CSS Module se construye con la página del Mapa.

Cada componente React trae **sus propios estilos** en `Component.module.css` (CSS Modules) junto al componente. No hay hojas de estilo compartidas entre componentes: lo único global son los tokens `--el-*`, la fuente y la base del documento (`src/styles/global.css`). Si un componente necesita el aspecto de otro, lo usa (composición); no copia ni comparte sus clases.

La página de cada componente en Storybook da su propósito, sus estados, qué hacer y qué evitar, los tokens que usa, su accesibilidad y el marcado para copiar.

## Línea base de accesibilidad

- Contraste WCAG 2.2 AA: 4,5:1 para texto y 3:1 para controles, foco y la trama. `build.py` comprueba cada par en ambos temas y hace fallar el build si alguno no pasa.
- Los rellenos de riesgo quedan por debajo de 3:1 frente a la superficie a propósito. Se apoyan en los bordes entre territorios, las etiquetas, la leyenda y una tabla equivalente.
- Usa elementos nativos: `<button>`, `<a href>`, `<label for>`, `<table>` con `<caption>` y `scope`. Los errores de campo usan `aria-invalid` más `aria-describedby`.
- Un mapa es un `<svg role="img">` con un `<title>`, y sus valores también están disponibles en una tabla.

## Cambiar el sistema

La guía tiene versión (`tokens.json` → `version`). Todo cambio pasa por la skill `elephants-design`.

- **Correcciones que mantienen la dirección visual** (un arreglo de contraste, un error, un componente candidato confirmado): ruta *Ajuste* de la skill. Se edita aquí, se regenera, se actualiza Storybook, se registra el cambio en `README.md` y se sube la versión menor o de parche.
- **Componentes o tokens nuevos** salen de una página que los necesita (Construir una página, paso 3). Cada uno necesita la aprobación del equipo antes de entrar en `components.json` y Storybook, y se implementa como componente React con su propio CSS Module.
- **Un cambio de dirección** (paleta, tipografía, lenguaje visual) es una ronda nueva en `docs/design/rounds/`. Si el equipo la acepta, se convierte en la siguiente versión mayor.

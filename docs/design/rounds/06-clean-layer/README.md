# Ronda 06: capa limpia

Estado: **No seleccionada** (2026-11-08). Al equipo le pareció más limpia, más llamativa y más invitadora para recorrer. Eligió la [Ronda 05](../05-system-reference/README.md), la versión editorial, porque el producto gira alrededor de los datos. Solo sus correcciones de errores (vista de pantalla completa en el celular, ancho del simulador de portátil) pasaron a la [guía v1.0](../../guide/README.md). Fecha: 2026-11-08. Tarea: [#6](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/6). Anterior: [Ronda 05](../05-system-reference/README.md); brief: [descubrimiento](../../discovery/brief.md).

## Comentarios atendidos

Revisión de Jouler sobre la Ronda 05 (2026-11-08):

- **Tipografía decidida: Public Sans.** Se descartan la propuesta B (Source Sans 3 + Source Serif 4) y el selector de tipografía.
- La barra «Pagado» se queda en rojo: señala una alerta. Es una excepción registrada a «el rojo significa riesgo alto».
- Los componentes candidatos (estado, cobertura, barras, avance, señal) entran a la referencia solo cuando se aprueben.
- El enlace de «pantalla completa» del celular abría la composición de escritorio.
- A la página de obra le faltaba claridad y calma visual (la línea de tiempo quedaba apretada después del bloque de dinero).
- Pregunta abierta: ¿una obra es una entidad de negocio distinta de un contrato?
- Nueva dirección: conservar la arquitectura de información y la jerarquía, y agregar una capa visual más profesional y limpia siguiendo el estilo web de Apple (referencia: [apple.com/es/macbook-air](https://www.apple.com/es/macbook-air/), consultada el 2026-11-08).

## Hipótesis

Separar el contenido con superficies y espacio en lugar de líneas hace cada pantalla más tranquila y fácil de recorrer con la vista. Así, la etiqueta de riesgo y la cifra destacada sobresalen con menos esfuerzo, sin cambiar lo que dice la página ni su orden. La capa consiste en tarjetas blancas sobre un lienzo gris claro, titulares grandes en seminegrita, una entrada en tinta seguida de texto gris y controles en forma de píldora.

## Qué cambió

| Área | Ronda 05 | Ronda 06 |
| --- | --- | --- |
| Página | Superficie blanca; cada bloque empieza con una línea de 2 px | `--el-color-canvas` (gris claro / negro) con tarjetas blancas (`.el-card`, radio 22 / 28 px); dentro de las tarjetas solo líneas finas de 1 px |
| Neutros | Tinta con matiz azul `#192C3C` | Tinta neutra `#1D1D1F`, secundario `#6E6E73`, línea fina `#E5E5EA`; oscuro: lienzo `#000`, tarjetas `#1C1C1E` |
| Tipografía | Dos propuestas, títulos en 700 | Solo Public Sans; títulos en 600 con espaciado más cerrado (`--el-tracking-*`); cuerpo de 17 px; cifra de 80 / 64 px |
| Patrón de texto | Párrafos simples | `.el-lead`: la idea clave en tinta y seminegrita, el resto en gris |
| Controles | Radio de 6 px | Botones, etiquetas, filtros y búsqueda en píldora (`--el-pill-radius`); campos de 12 px |
| Alertas | Distintivo más borde | Superficie teñida, ícono de color, sin borde |
| Barra de la app | Opaca con línea de 2 px | Translúcida (desenfoque) con una línea fina |
| Panel del mapa | Panel lateral con línea a la izquierda | Tarjeta flotante junto a la tarjeta del mapa; hoja inferior con radio grande en el celular |

**Iteración 2 (comentarios de Jouler, 2026-11-08), que recupera la estructura de la Ronda 05 donde se leía mejor:**

- Los títulos de página en el celular vuelven a negrita (700, 28 px). En escritorio se mantiene 600 a 48 px.
- Los contadores pasan a columnas iguales con líneas finas arriba, abajo y entre ellas, para que el resumen tenga estructura y quede alineado.

**Iteración 3 (2026-11-08):**

- Se probaron y se revirtieron las líneas de 2 px en las cifras destacadas del celular.
- Se probaron y se revirtieron los botones de la Ronda 05 (radio de 6 px, peso 600): los botones vuelven a ser píldoras.
- El texto de los contadores va centrado. Los contadores son compactos (número de 22 px, etiqueta de 13 px, máximo 420 px) y comparten la fila de orden, así que la lista de resultados empieza más arriba; «Mostrando 5 de 48» pasa a la línea del pie.

Sin cambios: los colores de riesgo y su orden, la trama gris, la etiqueta rellena con glifo de nivel, «una señal, no un veredicto», ningún umbral inventado, los íconos de Lucide.

## Página de obra y arquitectura de información (propuesta)

El modelo de datos del repositorio ya las separa (ver [fuentes de datos](../../../fuentes-de-datos.md)):

- Una **obra** es un proyecto de inversión del DNP identificado por su BPIN.
- Un **contrato** es un registro de SECOP.
- Se vinculan mediante «DNP – Proyectos ↔ Contratos» (`uwns-mbwd`). Una obra suele tener varios contratos (construcción, interventoría).

**Propuesta:** dos entidades con páginas propias, enlazadas en ambos sentidos.

- La página de obra empieza con «Lo principal» (35 % construido frente a 81 % pagado) y sigue con el avance, el dinero, **«Contratos de esta obra»** y la línea de tiempo.
- La página de contrato muestra **«Hace parte de la obra»**.
- Los detalles del proceso de selección (único oferente) viven en el contrato, porque un proceso pertenece a un contrato, no a un proyecto.

Estado: **aplazada**. Se decidirá con Esteban cuando el modelo de negocio tome forma (Jouler, 2026-11-08). Los ejemplos muestran la propuesta solo para poder revisarla. Si se acepta, afecta el README del alcance («Seguimiento de obras») y la cascada de alertas.

## Skill de terceros

En este repositorio no hay instalada ninguna skill de estilo Apple. `reference/ios.md` de Impeccable cubre apps nativas de iOS (HIG, SF Symbols, barras de pestañas), no un producto web, así que no se aplicó. Se encontraron skills comunitarias de diseño estilo Apple, pero **no se instalaron**: el flujo de skills exige leerlas completas, revisar su licencia y obtener aprobación antes. La capa de esta ronda sale de la página de referencia de Apple y de las skills de diseño existentes.

## Archivos y cómo reproducirla

La misma estructura de la Ronda 05:

- `tokens.json` agrega `canvas`, `tracking`, `pill-radius`, `card-radius` y `card-radius-lg`, y quita `rule-strong` y las propuestas de tipografía.
- `screens/phone.html?s=<pantalla>` es la nueva vista de celular en pantalla completa (390 px).
- Se quitan los archivos de fuente de la propuesta B.

```sh
python3 docs/design/rounds/06-clean-layer/build.py
```

## Validación

Ver `validation.md`.

# Detalle de contrato · Validación

> Paso 5 de [Construir una página](../../../../.claude/skills/elephant-designer/references/build-page.md) · 2026-11-19 · Sobre la [especificación](spec.md) y la pantalla `Módulos/Contracts/ContractDetailPage` de Storybook. **Pendiente la Aprobación 2 de Jouler.**

## Automático

| Comando | Resultado |
| --- | --- |
| `npm run design:check -- --filter contracts --filter signalitem --filter button` | `✓ 392 renders, 0 fallas, 0 avisos «incompleto» de axe (revisión manual).` |
| `npm run design:check` (completo) | `✗ 920 renders, 1 fallas, 54 avisos «incompleto» de axe (revisión manual).` |
| `npm run check` | Pasa: lint y formato sin cambios, tipos sin errores, 233 pruebas pasan y 6 se omiten, la compilación termina |
| Pipeline (`pytest`, `ruff`, `mypy src`) | 87 pruebas pasan, cobertura 99 %, sin avisos |

**La falla del barrido completo no es de la pantalla.** Es un render que la herramienta no pudo revisar: `Axe is already running`, en `contractdetailpage--recent · light · 1280 px`. En cada corrida cae en una historia distinta, también en historias que esta rama no tocó (Icon, RiskTag, Alert, DataTable, MapPage). No hubo ninguna violación de axe ni desplazamiento horizontal en ninguna corrida. Causa probable, según `elephant-tester`: el complemento de accesibilidad de Storybook corre su propio axe mientras `scripts/design-check.mjs` llama al suyo. El script no se tocó; queda como tarea aparte.

Los 54 avisos «incompleto» son del mapa y de `DataTable`, anteriores a esta rama. Ninguno es de la pantalla ni de sus componentes.

## En un navegador real

`npm run dev` con datos locales de los dos contratos reales (`CO1.PCCNTR.7954915` y `25-12-14382349-13325351`), Chromium, 1280 y 390 px:

- `/contratos/{id}` muestra la ficha; el foco llega al `h1` y la pestaña dice «Contrato de obra · ALCALDIA DE PASTO · EKOU Elephants».
- Un contrato que no existe (404) y un id con forma inválida (400) muestran «No encontramos ese contrato» con «Ir al mapa».
- «Leer completo» abre el objeto y pasa a «Leer menos»; «Copiar» deja el número en el portapapeles; «Compartir esta ficha» copia el enlace y lo dice; «← Pasto» lleva a `/mapa/52001`; el enlace a SECOP abre en otra pestaña con `rel="noopener"`.
- Sin desplazamiento horizontal.

## Con juicio, sobre las capturas

Revisión de `elephant-ux` (experiencia) y `elephant-tester` (técnica), sin haber construido la pantalla.

**Jerarquía.** A 390 px se ve primero la cifra, después el titular y después la frase del valor con su fuente. A 1280 px, lo tercero es el botón de SECOP. Coincide con la especificación.

**Prueba de 10 segundos.** Pasa en el caso típico y en el de empresa: tipo de contrato, entidad, valor y fuente caben sin desplazar. En celular, «cómo comprobarlo» queda a unas dos pantallas (pregunta abierta 7 de la especificación).

**Textos.** Sin nombres de personas naturales ni palabras prohibidas; «irregular» solo aparece negado. Toda cifra lleva fuente y fecha. «Sin datos» nunca aparece como 0.

**Riesgo y color.** Las señales solo existen en la historia de vista previa, con el aviso «Señales de ejemplo.» y la marca «Ejemplo». El nivel va en texto («Gravedad alta») además del color.

### Hallazgos corregidos

| Hallazgo | Corrección |
| --- | --- |
| Con valor inicial 0 decía «Se firmó por $ 0: subió…» | Se trata como desconocido: «Sin datos del valor al firmar.» |
| En el 404, «Volver» podía no hacer nada si la ficha se abrió en otra pestaña | Solo se ofrece si hay historial; si no, «Ir al mapa» |
| Un enlace a SECOP que no fuera `https` dejaba la ficha en error permanente | El modelo gold publica solo enlaces `https`; lo demás sale sin enlace. Prueba de datos nueva |
| «Copiar» fallaba en silencio sin portapapeles | Dice «No se pudo copiar. Selecciona el número y cópialo.» |
| El segundo «copiado» no se volvía a anunciar | La región de estado se vacía antes de cada mensaje |
| Faltaban historias: terminado, modalidad no reconocida, sin modalidad, copiar y compartir | Agregadas, con comprobación automática de los mensajes |
| Cada señal decía «Riesgo alto / intermedio / bajo» | «Gravedad alta / intermedia / baja»: califica la señal, no el contrato |
| La vista previa traía una tercera señal, «Se contrató sin concurso», que no estaba aprobada | Quedan las dos aprobadas |
| El aviso de vista previa usaba jerga («fase 2», «TASK-13») | «Señales de ejemplo. Todavía no se calculan…» |
| Los rótulos del plazo no quedaban bajo su tramo en escritorio | Desde 768 px cada rótulo va bajo su tramo |
| Sin fecha de fin o sin enlace a SECOP, la ficha callaba | Lo dice: «SECOP no trae la fecha de fin.» / «SECOP no trae el enlace a este contrato…» |
| «SECOP» nunca se explicaba | Al cierre: «SECOP es el registro público de los contratos del Estado.» |
| Descripciones de props en inglés; una medida suelta en CSS | Corregido |

### Diferencias frente al prototipo aprobado

- El botón principal usa el color de acción del sistema (azul), no tinta; los dos botones llevan ícono.
- El número de cada señal va en un cuadro, la forma del componente Señal del catálogo, no en un círculo.
- No está el enlace «Cómo se calculan»: no existe la página de destino (TASK-07).
- «Leer completo» va en su propia línea, bajo el texto recortado a tres líneas.
- El cierre va en varias líneas en lugar de una con «·».
- En el plazo, cuando hay muy pocos días agregados, el tramo no baja del ancho de su rótulo y la barra deja de ser proporcional.

### Sin resolver: decisiones de Jouler

Son las preguntas abiertas de la [especificación](spec.md#7-preguntas-abiertas). Las que salieron de esta validación: acceso a SECOP en celular (7), plazo visual en el caso típico (8), texto del valor $ 0 (9) y «Régimen especial» sin norma (10).

## Peso

`npm run build`: JavaScript 276,10 kB (87,88 kB con gzip) y CSS 25,91 kB (5,64 kB con gzip). Es un solo paquete: la ficha descarga también el código del mapa. No se midió contra `main`.

## Límites: lo que no se comprobó

- La página con datos reales publicados: la publicación de los contratos depende de un cambio en `corte-mensual.yml` que debe hacer una persona ([CI/CD](../../../ci-cd.md)). La prueba en navegador usó datos locales.
- Prueba en un celular real con una persona que no conozca el producto (paso 6).
- Lector de pantalla, recorrido de teclado a mano y zoom al 200 %.
- Que las páginas de SECOP enlazadas carguen.
- La página `Patrones/Navegación` de Storybook: `design:check` no revisa documentos MDX; solo se sabe que compila.
- El foco en el `h1` no tiene prueba automática (se comprobó a mano en el navegador).

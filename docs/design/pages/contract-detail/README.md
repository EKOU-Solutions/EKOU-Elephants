# Detalle de contrato

Estado: **Maqueta en revisión**. Contrato de la API aprobado el 2026-11-17. Tarea: TASK-12 [#19](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/19). Inicio: 2026-11-17.

| Paso | Archivo | Estado |
| --- | --- | --- |
| 0. Contrato | [contract.md](contract.md) | Aprobado el 2026-11-17 (Jouler) |
| 1. Datos | [data.md](data.md) | Hecho el 2026-11-17 (silver del corte 2026-11) |
| 2. Experiencia y especificación | [bocetos.html](bocetos.html), [spec.md](spec.md) | 2026-11-19: Jouler aprobó **A en celular** y **D4 en escritorio**, después de tres rondas de escritorio y de probar D1 y D4 como páginas ([prototipo-d1.html](prototipo-d1.html), [prototipo-d4.html](prototipo-d4.html)). Especificación escrita el mismo día |
| Datos y API | `pipeline/`, `src/modules/contracts/` | 2026-11-18: modelo gold `contract_detail`, `export-contracts` y `GET /api/contracts/:id`, con pruebas. Falta activar la publicación en `corte-mensual.yml` ([CI/CD](../../../ci-cd.md#detalle-de-los-contratos-task-12-pendiente-de-activar)) |
| 3. Componentes | `src/components/ui/SignalItem/`, `src/components/ui/Button/`, `src/modules/contracts/ui/ContractTerm/`, `.storybook/docs/patterns/Navigation.mdx` | 2026-11-19: Señal confirmada con color por gravedad; `Button` acepta enlace; plazo en tramos; patrón «Volver» documentado. Sin commit: pendiente de la revisión de Jouler |
| 4. Maqueta en Storybook | `src/modules/contracts/ui/ContractDetailPage/` | 2026-11-19: pantalla con una historia por estado, conectada a `/contratos/{id}` |
| 5. Validación | [validation.md](validation.md) | 2026-11-19: hecha, con los hallazgos corregidos |
| 6. Aprobación 2 | — | Pendiente: revisión de Jouler |

## Observaciones de Jouler para la maqueta (2026-11-19)

Hechas sobre los bocetos al aprobar A en celular. La maqueta de Storybook debe cumplirlas todas.

| # | Observación | Cómo se atiende |
| --- | --- | --- |
| 1 | Mostrar el plazo de forma más visual, con un componente que represente el atraso con color | Barra de plazo (inicial y agregado), dibujada en la ronda 2 de escritorio. Componente nuevo por `/crear-componente`. El color de atraso depende de la regla de TASK-13: hoy `retraso_dias` no es confiable ([data.md](data.md)) |
| 2 | La contratación directa lleva su ley, como regla | Toda modalidad se muestra con su norma: «Contratación directa (Ley 1150 de 2007)» |
| 3 | «Volver» debe ser un patrón único, tomado del PR del mapa, y quedar en una página de navegación de Storybook | El PR #47 usa `<nav aria-label="Volver">` con `Button` secundario, ícono `arrow-left` y el nombre del destino («← Colombia»). Se registra como estándar en una página de navegación de Storybook y el detalle lo usa igual |
| 4 | «Leer completo»: ejemplo interactivo de cómo funciona | Historia interactiva en la maqueta: abre el objeto en su lugar y se puede volver a recoger |
| 5 | Contrato inexistente: «Ir al mapa» si llegó por un enlace; «Volver» si venía de la lista de contratos | Dos historias del estado 404, una por origen |
| 6 | Las señales deben alinearse con los componentes de Storybook, con ejemplos que sigan los colores por gravedad | Usar `Signal item` (candidato del catálogo) y `RiskTag`; la maqueta trae ejemplos por nivel como vista previa. El nivel real sale de TASK-07 y TASK-13 |
| 7 | El escritorio no convence: otra ronda solo de escritorio | Ronda 2 en [bocetos.html](bocetos.html) |

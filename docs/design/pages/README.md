# Diseños de página

Una carpeta por página, construida con la ruta [Construir una página](../../../.claude/skills/elephant-designer/references/build-page.md) de la skill `elephant-designer`. Cómo trabaja desarrollo con ella: [flujo de diseño](../design-flow.md).

## Contrato de la carpeta

```
docs/design/pages/<pagina>/
  README.md        estado, fecha, enlaces, preguntas abiertas
  contract.md      de qué contrato de API (versión, fecha) depende el diseño
  data.md          exploración de datos: muestras reales, porcentaje de llenado, fase, campos sensibles
  bocetos.html     dos o tres composiciones en baja fidelidad a 390 px, con la recomendada y la elegida
  spec.md          propósito, tabla de jerarquía (campo → componente → tokens), estados, textos
  validation.md    resultado de npm run design:check, revisión con juicio sobre las capturas, prueba de 10 segundos, límites
```

La maqueta no es un archivo de esta carpeta: es la pantalla en Storybook, `Módulos/<Módulo>/<Page>Page`, en `src/modules/<módulo>/ui/<Page>Page/`, con una historia por estado y sus datos de muestra. Los componentes que la pantalla arma quedan en el mismo grupo, `Módulos/<Módulo>/<Component>`; los componentes UI nuevos o confirmados, en `Componentes/UI/`.

## Registro de páginas

| Página | Estado | Contrato |
| --- | --- | --- |
| [Mapa](map/README.md) | *Aprobada* 2026-11-17 (Aprobación 2 de la experiencia en una sola pantalla: mapa a pantalla completa con ficha deslizable; sin color de riesgo hasta TASK-07) | [contract.md](map/contract.md) |
| [Resumen municipal](resumen-municipal/README.md) | *Aprobada* 2026-11-22 (gasto público por municipio con selector de año; CUIPO y SECOP separados) | [contract.md](resumen-municipal/contract.md) |

Estados: *Bloqueada: sin contrato* · *Explorando* · *Especificación pendiente de aprobación* · *Maqueta en revisión* · *Aprobada*.

## Referencia tentativa

**Tentativa. No es una especificación.** Son puntos de partida, tomados del alcance del [README raíz](../../../README.md#funcionalidades) y de la lista de conjuntos de datos de [fuentes de datos](../../fuentes-de-datos.md). Lo que cada página muestre al final se decide en su propio `spec.md`, después de su contrato y de la exploración de datos. Los nombres de componentes remiten al catálogo (Storybook, fuente en [components.json](../guide/components.json)); los candidatos se marcan como *(candidato)*. «Datos de origen probables» es de dónde la ingesta toma los campos; la página en sí se diseña sobre el contrato de nuestra API.

| Página (tentativa) | Pregunta que responde | Datos de origen probables (MVP / fase 2) | Componentes que pueden aplicar |
| --- | --- | --- | --- |
| Mapa (Mapa de inversión) | ¿Cómo se compara mi territorio y dónde debería mirar? | Contratos SECOP II `jbjy-vk9h`, DIVIPOLA `gdxc-w37w` (MVP); presupuesto CUIPO, proyectos DNP (fase 2) | Mapa + leyenda, etiqueta de riesgo, cifra destacada, cobertura *(candidato)*, barras *(candidato)*, tabla de datos |
| Búsqueda (Buscador) | ¿Qué contratos u obras coinciden con lo que busco? | Contratos SECOP II `jbjy-vk9h`, Procesos `p6dx-8zbt` (MVP); proyectos DNP (fase 2) | Campo de búsqueda, filtro activo, contador, etiqueta de riesgo, fila de resultado |
| Detalle de contrato | ¿Por qué este contrato tiene señales? | Contratos `jbjy-vk9h`, Procesos `p6dx-8zbt`, Adiciones `cb9c-h8sn`, Suspensiones `u99c-7mfm` (MVP); Ejecución `mfmm-jqmq`, Proyectos ↔ Contratos `uwns-mbwd` (fase 2) | Etiqueta de riesgo (grande), cifras destacadas, señal *(candidato)*, estado *(candidato)*, alerta, botones |
| Detalle de obra | ¿Esta obra avanza, y cómo se compara el dinero con el avance? | Proyectos DNP `cf9k-55fw`, Seguimiento `7mxf-bp6x`, Proyectos ↔ Contratos `uwns-mbwd` (fase 2) | Avance *(candidato)*, cifras destacadas, filas enlazadas, línea de tiempo. **Modelo de entidades pendiente (obra frente a contrato, con Esteban)** |
| Entidades (Presupuesto por entidad) | ¿En qué gasta su presupuesto cada entidad pública? | Presupuesto CUIPO, PGN (fase 2); Contratos `jbjy-vk9h` (MVP) | Barras *(candidato)*, tabla de datos, cifras destacadas |
| Contratistas (Principales contratistas) | ¿Quién recibe más contratos y dinero, y cómo van sus obras? | Contratos `jbjy-vk9h`, Sanciones `it5q-hg94` / `4n4q-k399` (MVP); RUES (fase 2) | Tabla de datos, etiqueta de riesgo, contador |
| Alertas (Alertas de riesgo) | ¿Qué señales aparecen y dónde? | Calculadas a partir de los conjuntos anteriores; patrones definidos en TASK-07 | Etiqueta de riesgo, señal *(candidato)*, mapa, tabla de datos |

Regla transversal del alcance: el filtro territorial global (código DANE) limita todas las páginas.

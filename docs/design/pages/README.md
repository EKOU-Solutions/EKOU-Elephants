# Diseños de página

Una carpeta por página, construida con la ruta [Construir una página](../../../.claude/skills/elephants-design/references/build-page.md) de la skill `elephants-design`. Cómo trabaja desarrollo con ella: [flujo de diseño](../design-flow.md).

## Contrato de la carpeta

```
docs/design/pages/<pagina>/
  README.md        estado, fecha, enlaces, preguntas abiertas
  contract.md      de qué contrato de API (versión, fecha) depende el diseño
  data.md          exploración de datos: muestras reales, porcentaje de llenado, fase, campos sensibles
  spec.md          propósito, tabla de jerarquía (campo → componente → tokens), estados, textos
  mockup.html      objetivo visual: celular + escritorio, claro + oscuro (la salida generada se ignora en git)
  validation.md    accesibilidad, desbordamiento, detector, textos, prueba de 10 segundos, límites
```

Los componentes nuevos o confirmados por la página quedan documentados con su historia en Storybook.

## Registro de páginas

| Página | Estado | Contrato |
| --- | --- | --- |
| — | Ninguna página empezada todavía | — |

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

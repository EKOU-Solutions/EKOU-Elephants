# Patrones sospechosos de una obra

Qué patrones marcan una obra como sospechosa, cómo se calculan, con qué umbral y qué datos necesitan. Cada patrón está medido sobre todas las obras públicas de Colombia firmadas entre 2018 y 2026.

> Tarea: [TASK-07 Definir patrones sospechosos de una obra](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/8) · Datos: corte 2026-11 de la [ingesta (TASK-06)](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/7) · Cálculo reproducible: [`analysis/patrones_sospechosos.py`](../analysis/patrones_sospechosos.py)

## En 1 minuto

- **7 patrones de alerta y 2 de seguimiento**, cada uno con base legal o en marcos internacionales (Open Contracting Partnership, índice de riesgo de Fazekas) y medido en 240.752 obras por $280 billones.
- **El patrón más costoso es el oferente único.** Sin competencia, la obra se adjudica al precio del presupuesto oficial: un descuento mediano de 0,05 % frente a 3,7 % con competencia en licitación de obra. Se estiman **$282 mil millones** de sobrecosto en 9.825 obras de SECOP II.
- **Las entidades usan el tope legal de adiciones como meta.** Hay 4 veces más obras con adiciones entre el 45 % y el 50 % que entre el 40 % y el 45 %.
- **Los patrones se agrupan como predice la teoría:** oferente único y proceso exprés aparecen juntos 4,1 veces más de lo esperado por azar, y sobrecosto y prórroga excesiva, 2,7 veces.
- **El mapa compara cada municipio contra lo esperado**, no con una tasa cruda. Sin esa corrección, el mapa pintaría qué plataforma usa cada municipio (SECOP I publica menos datos) y no su riesgo: la correlación con la plataforma pasa de −0,70 a −0,01.
- **Una alerta no es una acusación.** Indica una obra que merece la mirada de un ciudadano o de un órgano de control.

## 1. Criterios para elegir un patrón

Un patrón entra al catálogo solo si cumple los cuatro criterios:

| Criterio | Por qué |
|---|---|
| **Base legal o internacional** | El umbral sale de la ley colombiana o de marcos usados en otros países ([Red Flags for Integrity](https://www.open-contracting.org/resources/red-flags-integrity-giving-green-light-open-data-solutions/) de OCP; índice de riesgo de corrupción de Fazekas, Tóth y King, 2016), no de una opinión |
| **Calculable con datos abiertos** | Sale de campos publicados en datos.gov.co, con su cobertura medida |
| **Discrimina** | Su tasa base es baja. Un patrón que marca a la mitad de las obras no distingue nada |
| **Validado con datos** | Se asocia con daño medible (precio, sobrecosto) o con otros patrones más de lo esperado por azar |

## 2. Universo: qué es una obra

**Obra:** contrato de tipo "Obra" o con código UNSPSC 72 (construcción y mantenimiento), firmado entre 2018 y 2026 y no cancelado.

Se excluyen los contratos de prestación de servicios y los firmados por la causal de servicios profesionales. Se excluyen 124.169 contratos; al revisar muestras, los de código 72 eran en realidad servicios personales (conductores, apoyo administrativo, cuidado de animales), y habrían contaminado los patrones.

| Fuente | Obras | Valor |
|---|---|---|
| SECOP I | 166.060 | $116,2 billones |
| SECOP II | 74.692 | $164,0 billones |

**SECOP I no publica oferentes, plazos del proceso ni prórrogas.** Por eso P1, P2 y P5 solo se calculan en SECOP II, y el nivel municipal corrige esa diferencia (sección 6).

## 3. Catálogo de patrones

### Patrones de alerta

| # | Patrón | Qué significa para un ciudadano | Fórmula | Umbral y por qué | Gravedad |
|---|---|---|---|---|---|
| P1 | **Oferente único** | "Se abrió un concurso y se presentó una sola empresa." | Modalidad competitiva y `proveedores_unicos_con_respuesta = 1` | La ley exige convocatoria pública en licitación, selección abreviada, concurso, subasta y mínima cuantía; un solo oferente anula la competencia. Bandera central de OCP y Fazekas | Media |
| P2 | **Proceso exprés** | "El proceso fue tan rápido que casi nadie alcanzó a presentarse." | Días de publicación a adjudicación por debajo del percentil 10 de su modalidad y año | Percentil 10 calculado con los datos: es relativo, porque cada modalidad tiene plazos legales distintos | Media |
| P3 | **Adición por encima del tope legal** | "La obra terminó costando más del 150 % de lo pactado, y la ley no lo permite." | `valor_actual / valor_inicial > 1,5` | Ley 80 de 1993, art. 40: los contratos no pueden adicionarse en más del 50 % de su valor inicial | Alta |
| P4 | **Adición hasta el tope** | "Le subieron el precio casi hasta el máximo que permite la ley." | `1,45 ≤ valor_actual / valor_inicial ≤ 1,5` | El amontonamiento justo debajo del 50 % (sección 5) muestra que el tope se usa como meta | Media |
| P5 | **Prórroga excesiva** | "La obra se demoró más del triple de lo prometido." | `fecha_fin − fecha_fin_original > 2 × plazo original` | Percentil 90 de las prórrogas en SECOP II: las prórrogas cortas son comunes, las que triplican el plazo no | Media |
| P6 | **Fraccionamiento** | "Partieron la obra en contratos pequeños, el mismo día y al mismo contratista, para evitar un concurso más exigente." | ≥ 2 contratos de mínima cuantía de la misma entidad al mismo contratista el mismo día, que juntos superan 100 SMMLV | La mínima cuantía no puede superar el 10 % de la menor cuantía (Ley 1150 de 2007, art. 2), que nunca pasa de 100 SMMLV. Partir un contrato para eludir la modalidad viola la selección objetiva | Alta |
| P7 | **Contratista dominante** | "La misma empresa se queda con la mayor parte de las obras de la entidad, año tras año." | Un contratista recibe ≥ 50 % del valor de las obras de una entidad (con ≥ 5 obras) en 3 años o más | Un año dominante es común en municipios pequeños (38 % de los casos); 3 años o más es raro (36 pares entidad–contratista en todo el país) | Alta |

### Patrones de seguimiento

No son sospechosos por sí solos: se muestran como contexto y no suben el nivel de alerta.

| # | Patrón | Por qué es solo seguimiento |
|---|---|---|
| S1 | **Urgencia manifiesta** | Es legal y responde a emergencias reales: su valor sube de $236 mil millones en 2019 a $986 mil millones en 2020 (pandemia) y vuelve a subir en 2022 (temporada invernal). Merece revisión, porque salta la competencia |
| S2 | **Obra suspendida** | Puede ser un problema real o una pausa justificada; el dataset de suspensiones (`u99c-7mfm`) trae el motivo y permitiría separarlos |

### Tasa base de cada patrón

| Patrón | SECOP I | SECOP II | Valor involucrado |
|---|---|---|---|
| P1 Oferente único | — | 10.259 (13,7 %) | $16,3 billones |
| P2 Proceso exprés | — | 2.923 (3,9 %) | $4,4 billones |
| P3 Adición sobre el tope | 502 (0,3 %) | 1.263 (1,7 %) | $16,5 billones |
| P4 Adición hasta el tope | 3.668 (2,2 %) | 4.580 (6,1 %) | $13,0 billones |
| P5 Prórroga excesiva | — | 7.436 (10,0 %) | $19,4 billones |
| P6 Fraccionamiento | 611 (0,4 %) | 328 (0,4 %) | $48 mil millones |
| P7 Contratista dominante | 360 (0,2 %) | 680 (0,9 %) | $1,1 billones |
| S1 Urgencia manifiesta | 2.757 (1,7 %) | 1.227 (1,6 %) | $4,1 billones |
| S2 Suspendida | — | 1.206 (1,6 %) | $5,6 billones |

### Patrones evaluados y descartados

| Patrón | Por qué se descartó |
|---|---|
| Obra vencida sin cierre | Lo es el 58 % de las obras de SECOP I y el 49 % de SECOP II: mide que las entidades no actualizan el estado en SECOP, no un riesgo |
| Contratista con más del 50 % de las obras de un año | Pasa en el 38 % de las entidades con 5 obras o más; en municipios pequeños una obra grande domina el año. Se reemplazó por la persistencia de 3 años (P7) |
| Contratos cercanos en 30 días al mismo contratista | El 25 % de las obras directas o de mínima cuantía; demasiado común. Se reemplazó por la versión del mismo día que supera el tope (P6) |
| Obra contratada como servicio profesional | Al revisar casos, casi todos eran servicios personales mal marcados como "Obra", no obras disfrazadas |
| Oferente único en contratación directa | La modalidad tiene un solo oferente por diseño |

## 4. Las fórmulas paso a paso, con ejemplos

Esta sección explica cada cálculo con un caso concreto, para revisarlo sin leer código. Las cifras de los ejemplos son ilustrativas; las reales están en las tablas de este documento.

### Patrones por obra

**P1 · Oferente único**

```
alerta si: la modalidad es competitiva  Y  proveedores_unicos_con_respuesta = 1
```

Modalidades competitivas: licitación, selección abreviada, concurso, subasta y mínima cuantía.
*Ejemplo:* una alcaldía abre una licitación para pavimentar una vía y se presenta una sola empresa → alerta. En contratación directa no aplica, porque esa modalidad tiene un solo oferente por diseño.

**P2 · Proceso exprés**

```
días del proceso = fecha_adjudicacion − fecha_publicacion
alerta si: días del proceso < percentil 10 de su misma modalidad y año
```

*Ejemplo:* si el 10 % más rápido de las licitaciones de obra de 2024 dura menos de 25 días, una licitación adjudicada en 18 días activa la alerta. Se compara contra su propia modalidad porque cada una tiene plazos legales distintos: una mínima cuantía de 9 días es normal; una licitación de 9 días, no.

**P3 · Adición por encima del tope legal**

```
razón de valor = valor_actual / valor_inicial
alerta si: razón > 1,5
```

*Ejemplo:* una obra contratada por $100 millones termina costando $160 millones: razón 1,6. Supera el 50 % de adición que permite la Ley 80 → alerta **alta**.

**P4 · Adición hasta el tope**

```
alerta si: 1,45 ≤ razón ≤ 1,5
```

*Ejemplo:* la misma obra termina en $148 millones (razón 1,48). Es legal, pero agotó casi todo el margen.

**P5 · Prórroga excesiva**

```
plazo original = fecha_fin_original − fecha_inicio
prórroga       = fecha_fin − fecha_fin_original
alerta si: prórroga > 2 × plazo original
```

*Ejemplo:* una obra pactada a 6 meses debía terminar en junio, y su nueva fecha de fin es julio del año siguiente. Se prorrogó 13 meses, más de 2 × 6 → alerta. En total tardaría más del triple de lo prometido.

**P6 · Fraccionamiento**

```
agrupar por: misma entidad + mismo contratista + mismo día de firma (solo mínima cuantía)
alerta si: hay 2 o más contratos  Y  su suma > 100 SMMLV del año
```

*Ejemplo:* en 2025 el SMMLV es $1.423.500, así que 100 SMMLV son $142,35 millones. Un municipio firma el mismo día tres mínimas cuantías de $60 millones con la misma empresa: suman $180 millones, más de lo que permite cualquier mínima cuantía → alerta **alta** en los tres contratos.

**P7 · Contratista dominante**

```
para cada entidad y año con 5 obras o más:
    participación = valor de las obras del contratista / valor total de las obras de la entidad
alerta si: participación ≥ 50 %  en 3 años o más (no necesariamente seguidos)
```

*Ejemplo:* la misma empresa se lleva más de la mitad del valor en obras de un municipio en 2021, 2022 y 2024 → alerta **alta** en todas sus obras con esa entidad.

**Seguimiento (no suben el nivel de alerta)**

- **S1 Urgencia manifiesta:** la justificación de la modalidad menciona "urgencia".
- **S2 Suspendida:** el estado del contrato es "suspendido".

### Nivel de alerta de una obra

```
Alta        → activó al menos un patrón grave: P3, P6 o P7
Media       → activó 2 o más patrones medios: P1, P2, P4 o P5
Baja        → activó 1 patrón medio
Sin alerta  → ninguno
```

*Ejemplo:* oferente único (P1) y proceso exprés (P2) → **media**. Si además tuvo una adición del 60 % (P3) → **alta**.

### Nivel de un municipio: razón observado / esperado

No se usa "% de obras con alerta", porque SECOP I no publica oferentes ni prórrogas y los municipios que lo usan se verían limpios por falta de datos.

**Paso 1, tasa esperada.** Para cada combinación de fuente (SECOP I o II), tipo de modalidad (competitiva o directa) y año:

```
tasa esperada = obras con alguna alerta / total de obras de esa combinación (a nivel nacional)
```

**Paso 2, sumas del municipio:**

```
observadas = obras del municipio con alguna alerta
esperadas  = Σ tasa esperada de cada una de sus obras
```

**Paso 3, razón con contracción bayesiana:**

```
razón = (observadas + 5) / (esperadas + 5)
```

*Ejemplo:* un municipio tiene 40 obras. Por su mezcla de fuentes, modalidades y años se esperaban 6 con alerta, y tiene 15:

```
razón = (15 + 5) / (6 + 5) = 20 / 11 = 1,8×   → "más alertas de lo esperado"
```

**¿Para qué el +5?** Un municipio con 2 obras, 1 con alerta, donde se esperaban 0,2:

```
sin +5:  1 / 0,2              = 5,0×   ← rojo intenso por una sola obra (azar)
con +5:  (1 + 5) / (0,2 + 5)  = 1,15×  ← "lo esperado": una obra no es evidencia suficiente
```

Las 5 alertas "virtuales" acercan a 1× a los municipios con pocos datos; uno con cientos de obras casi no se mueve.

**Departamento:** la misma fórmula, sumando las alertas observadas y esperadas de todos sus municipios.

### Fórmulas de validación

**Descuento frente al presupuesto oficial** (mide el daño de P1):

```
descuento = 1 − valor_adjudicado / precio_base
```

*Ejemplo:* presupuesto oficial de $500 millones, adjudicado en $482 millones → 3,6 % de descuento. Con oferente único, la mediana es cercana a 0 %: la obra se adjudica al precio del presupuesto.

**Sobrecosto estimado del oferente único:**

```
por cada obra con oferente único:
    sobrecosto = precio_base × (descuento promedio de obras comparables con competencia − su descuento)
comparables = misma modalidad + mismo año + mismo decil de presupuesto
```

*Ejemplo:* una obra de $1.000 millones con 0 % de descuento, cuyas comparables con competencia lograron 3,5 % → $35 millones. Sumado sobre las 9.825 obras: $282 mil millones.

**Lift** (prueba que dos patrones miden algo real y no azar):

```
lift = P(A y B) / ( P(A) × P(B) )
```

*Ejemplo:* si el 14 % de las obras tiene oferente único y el 4 % proceso exprés, por azar coincidirían en el 0,56 % (14 % × 4 %). Si coinciden en el 2,3 %, el lift es ≈ 4: aparecen juntos 4 veces más de lo esperado. Un lift de 1 sería independencia.

## 5. Validación con datos reales

### El oferente único se paga en el precio

Sin competencia, la obra se adjudica al valor del presupuesto oficial. Procesos de obra de SECOP II con un solo contrato:

| Modalidad | Procesos | Descuento mediano, oferente único | Descuento mediano, con competencia | Adjudicados prácticamente al presupuesto (único / competido) |
|---|---|---|---|---|
| Selección abreviada de menor cuantía | 12.600 | 0,03 % | 2,4 % | 82 % / 35 % |
| Mínima cuantía | 12.588 | 0,07 % | 13,7 % | 66 % / 26 % |
| Licitación de obra pública | 6.216 | 0,05 % | 3,7 % | 82 % / 30 % |

Si las 9.825 obras con oferente único hubieran logrado el descuento promedio de procesos comparables (misma modalidad, año y decil de presupuesto), habrían costado **$282 mil millones menos**, el 2,1 % de sus $13,35 billones. Es una asociación, no una prueba de causa: puede haber obras con oferente único porque el mercado local es pequeño.

En cambio, una vez controlados la modalidad, el año y el tamaño, el oferente único **no** predice adiciones de valor (razón 0,67). Su daño está en la adjudicación, no en la ejecución.

### El tope legal se usa como meta

Razón entre valor final y valor inicial de las obras:

| Fuente | 1,40 – 1,45 | **1,45 – 1,50** | 1,50 – 1,55 |
|---|---|---|---|
| SECOP I | 945 | **3.664** | 123 |
| SECOP II | 1.126 | **4.575** | 404 |

Sin el tope, la distribución bajaría de forma suave. El salto de 4 veces justo antes del 50 % y la caída después muestran que las adiciones se ajustan al máximo legal.

### Los patrones se agrupan como predice la teoría

Si los patrones miden riesgo, deben aparecer juntos más de lo que predice el azar. El *lift* es P(A y B) / (P(A) × P(B)); 1 significa independencia. Obras de SECOP II:

| Patrones | Obras con ambos | Lift | Lectura |
|---|---|---|---|
| P1 Oferente único + P2 Proceso exprés | 1.695 | **4,13** | Los procesos rápidos espantan oferentes |
| P3 Adición sobre tope + P5 Prórroga excesiva | 393 | **2,65** | La obra que se desborda en plata también se desborda en tiempo |
| P4 Adición al tope + P7 Contratista dominante | 106 | **2,39** | El contratista "de la casa" recibe adiciones hasta el máximo |
| P1 Oferente único + P6 Fraccionamiento | 87 | 1,93 | |
| P4 Adición al tope + P6 Fraccionamiento | 39 | 1,83 | |
| P1 Oferente único + P3 Adición sobre tope | 124 | 0,67 | Confirma que el oferente único no anticipa problemas de ejecución |

Salen dos familias: **falta de competencia** (P1, P2, P6) y **ejecución problemática** (P3, P4, P5), con P7 como puente.

## 6. Nivel de alerta: obra → municipio → departamento

### Obra

| Nivel | Regla | SECOP I | SECOP II |
|---|---|---|---|
| **Alta** | Al menos un patrón grave (P3, P6 o P7) | 0,9 % | 3,0 % |
| **Media** | Dos o más patrones medios (P1, P2, P4, P5) | — | 4,3 % |
| **Baja** | Un patrón medio | 2,2 % | 18,7 % |
| Sin alerta | Ninguno | 96,9 % | 74,0 % |

La obra siempre muestra **qué patrones activó y por qué**, nunca solo un color.

### Municipio y departamento

Una tasa cruda ("% de obras con alerta") sería injusta: SECOP I publica menos datos, así que un municipio que contrata por SECOP I se vería limpio por falta de información. **La correlación entre la proporción de obras en SECOP I y la tasa cruda es −0,70.**

Por eso el mapa usa una **razón estandarizada**, el mismo método que se usa en salud pública para comparar mortalidad entre regiones:

```
alertas esperadas = Σ tasa nacional de alerta para la fuente, tipo de modalidad y año de cada obra
razón             = (alertas observadas + 5) / (alertas esperadas + 5)
```

- **Estandarización:** cada obra se compara con obras de su misma fuente, tipo de modalidad (competitiva o directa) y año. La correlación con la plataforma baja a **−0,01**.
- **Contracción bayesiana (+5):** suma 5 alertas "virtuales" en la razón esperada (1,0), para que un municipio con 3 obras no aparezca en rojo por una sola alerta. Ningún municipio con menos de 10 obras llega a 2×.
- **Departamento:** misma fórmula, sumando las alertas observadas y esperadas de sus municipios.
- Solo cuentan las obras con ubicación de confianza media o mejor (ver [resultados de la ingesta](resultados-poc.md)).

**Escala del mapa** (1.099 municipios con obras):

| Razón | Se lee como | Municipios |
|---|---|---|
| Menos de 0,8× | Menos alertas de lo esperado | 418 |
| 0,8× a 1,25× | Lo esperado | 506 |
| 1,25× a 2× | Más alertas de lo esperado | 159 |
| 2× o más | Más del doble de lo esperado | 16 |

La escala usa un solo color que se intensifica, no verde y rojo: "menos alertas" no significa "limpio", solo que los datos publicados no muestran estos patrones.

## 7. Datos necesarios

### Disponibles hoy en la ingesta

| Patrón | Dataset | Campos |
|---|---|---|
| P1, P2 | SECOP II – Contratos (`jbjy-vk9h`) + Procesos (`p6dx-8zbt`) | `modalidad`, `proveedores_unicos_con_respuesta`, `precio_base`, `valor_adjudicado`, `fecha_publicacion`, `fecha_adjudicacion` |
| P3, P4 | SECOP II – Contratos + Procesos · SECOP I (`f789-7hwg`) | `valor_actual`, `valor_inicial` |
| P5, S2 | SECOP II – Contratos | `fecha_inicio`, `fecha_fin`, duración del proceso, `estado_contrato` |
| P6, P7 | SECOP I y II | `nit_entidad`, `contratista_id` (seudónimo), `fecha_firma`, `valor_actual`; tabla `smmlv` |
| S1 | SECOP I y II | `justificacion_modalidad` |
| Mapa | SECOP II – Ubicaciones (`gra4-pcp2`) + DIVIPOLA (`gdxc-w37w`) | `cod_mpio_ejecucion`, `confianza_ubicacion` |

### Faltan para patrones futuros

| Patrón futuro | Dato que falta | Fuente |
|---|---|---|
| Plazo corto para presentar ofertas (más preciso que P2) | Fecha de cierre de recepción de ofertas | SECOP II – Procesos (verificar el campo) |
| Oferentes que siempre pierden o se turnan (colusión) | Ofertas por proceso | SECOP II – Ofertas (las vistas de 2022 y 2023 están vacías en origen) |
| Obra con avance físico atrasado | Avance real frente al esperado | SECOP II – Ejecución (`mfmm-jqmq`), solo el 8,5 % de las obras reporta |
| Empresa recién creada que gana obras grandes | Fecha de matrícula y actividad económica | RUES (`c82u-588k`) |
| Contratista sancionado que sigue contratando | Multas, sanciones e inhabilidades | Multas SECOP I y II (`4n4q-k399`, `it5q-hg94`), SIRI (`iaeu-rcn6`) |
| Motivo de la suspensión | Motivo y fechas | SECOP II – Suspensiones (`u99c-7mfm`) |

## 8. Limitaciones

- **Una alerta no prueba corrupción.** Un oferente único puede deberse a un mercado local pequeño, y una adición puede estar justificada. El mapa debe decirlo de forma visible.
- **La calidad depende de lo que publica cada entidad.** Una entidad que no registra sus adiciones en SECOP nunca activará P3 ni P4.
- **P2 mide de publicación a adjudicación**, que incluye la evaluación de ofertas. Con un solo oferente la evaluación es más corta, así que parte de la asociación P1–P2 puede ir en sentido contrario.
- **P3 depende del valor inicial**, que en SECOP II sale del proceso; un error de digitación en ese campo puede activar o esconder la alerta.
- **Los umbrales basados en percentiles (P2, P5)** se recalculan en cada corte; la tasa de esos patrones es estable por construcción y no sirve para medir tendencias.
- **El oferente único en obras de menor cuantía sube del 10 % (2018) al 47 % (2025).** Una explicación probable es que los municipios pequeños, con menos competencia, entraron a SECOP II entre 2020 y 2022. No está demostrado; la razón esperada por año evita que esa tendencia se confunda con riesgo en el mapa.

## 9. Cómo reproducirlo

Con el corte de la ingesta ya transformado ([pipeline/README.md](../pipeline/README.md)):

```bash
pipeline/.venv/bin/python analysis/patrones_sospechosos.py
```

El script solo lee la base, e imprime todas las tablas de este documento.

**Siguiente paso:** llevar estas reglas al pipeline como un modelo dbt (`alertas_obra` y la razón por municipio en `mapa_municipios`), con pruebas, para que cada corte mensual las recalcule.

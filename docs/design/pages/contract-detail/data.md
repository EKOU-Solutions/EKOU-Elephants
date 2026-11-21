# Detalle de contrato · Exploración de datos

> Página: Detalle de contrato (TASK-12, [#19](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/19)) · Fecha: 2026-11-17 · Paso 1 de [Construir una página](../../../../.claude/skills/elephant-designer/references/build-page.md)

## Qué se leyó

| Qué | Dónde | Fecha |
| --- | --- | --- |
| Capa silver completa, `contratos.parquet` (1,4 GB, 11.451.396 filas) | Release [`corte-2026-11`](https://github.com/EKOU-Solutions/EKOU-Elephants/releases/tag/corte-2026-11) | 2026-11-17 |
| Reporte de calidad, `calidad_corte.json` | El mismo Release | 2026-11-17 |
| Modelo y reglas | `pipeline/transform/models/silver/contratos.sql` en `main` @ `7a4818d` | 2026-11-17 |

Se consultó con DuckDB 1.4.5 sobre el archivo descargado. La API del detalle todavía no existe, así que esta es la opción 2 del paso 1: la salida de la ingesta, llevada a la forma del [contrato](contract.md). Los porcentajes son de los contratos firmados desde 2024 (3,59 M), salvo que se diga otra cosa.

## Qué hay de verdad

### Volumen

- 11,45 M de contratos: 5,73 M de SECOP I y 5,72 M de SECOP II. `id_contrato` es único en todo el corte, también entre las dos fuentes.
- Cerca de 1,15 M por año. En la ventana del mapa (2021–2026) hay 7,49 M, y 6,78 M tienen municipio de ejecución confiable (`alta`, `media_alta` o `media`).
- Por municipio (2025–2026): mediana 610 contratos, percentil 90 de 2.304, máximo 418.603 (Bogotá). Siguen Cali (115.741) y Medellín (102.994).
- Un contrato en JSON con todos los campos de silver pesa 1,4 kB en promedio (percentil 99: 1,7 kB; máximo: 2,7 kB).

### Identificadores y enlace a la fuente

| Fuente | Forma del id | Ejemplo | Enlace a SECOP |
| --- | --- | --- | --- |
| SECOP II | `CO1.PCCNTR.<número>` | `CO1.PCCNTR.7954915` | `community.secop.gov.co/…/OpportunityDetail/Index?noticeUID=…` |
| SECOP I | cuatro números con guiones, hasta 23 caracteres | `25-12-14382349-13325351` | `www.contratos.gov.co/consultas/detalleProceso.do?numConstancia=…` |

`url_proceso` viene en el 100 % de los contratos de las dos fuentes.

### Llenado por campo

| Campo de silver | SECOP I | SECOP II | Nota |
| --- | --- | --- | --- |
| `objeto`, `nombre_entidad`, `tipo_contrato`, `modalidad`, `fecha_firma`, `fecha_fin`, `valor_actual` | 100 % | 100 % | |
| `nit_entidad` | 94,8 % | 100 % | |
| `fecha_inicio` | 100 % | 98,4 % | |
| `fecha_fin_original` y `retraso_dias` | 99,9 % | 92,7 % | Ver «Sorpresas» |
| `valor_inicial` y `pct_sobrecosto` | 99,5 % | 89,8 % | En SECOP II el valor de firma se toma del proceso |
| `pct_sobrecosto` mayor que 0 | 6,1 % | 24,5 % | |
| `dias_adicionados` mayor que 0 | 3,3 % | 19,4 % | Subregistra (regla S06) |
| `valor_pagado` | 0 % | 100 % | `pago_reportado` solo en el 54,6 % de SECOP II |
| `respuestas_al_proceso`, `proveedores_invitados` | 0 % | 99,9 % | Competencia: solo SECOP II |
| `nombre_contratista` | 25,2 % | 13,0 % | Solo personas jurídicas; ver «Datos sensibles» |

### Valores típicos y extremos

- **Objeto:** mediana 228 caracteres, percentil 95 de 455, máximo 1.450. Viene en mayúsculas o mezclado, con abreviaturas, y a veces cortado.
- **Entidad:** hasta 161 caracteres. **Contratista (empresa):** hasta 150.
- **Valor actual:** de $ 0 (20.903 contratos) a $ 8,83 billones entre los valores confiables. 325 contratos traen alerta de magnitud (`error_magnitud`: 229; `revisar_magnitud`: 22; `supera_tope_minima_cuantia`: 74); `valor_confiable` los marca.
- **Estado (`estado_ejecucion`):** `vencido_sin_cierre` 1,91 M; `terminado` 1,00 M; `activo` 0,63 M; `sin_iniciar` 48.787; `suspendido` 4.128.
- **Tipo de contrato:** el 85 % es prestación de servicios. Las dos fuentes escriben distinto el mismo valor («Prestación de servicios» y «Prestación de Servicios», «Suministro» y «Suministros»). Obra: 42.182.
- **Modalidad:** contratación directa en el 74 %. También sin unificar entre fuentes.
- **Adiciones y suspensiones (2024 en adelante):** 678.304 contratos cuestan más que al firmarse; 44.378 superan el 50 %; 581.665 tienen días adicionados; 4.128 están suspendidos (todos de SECOP II).

## Qué es de fase 2

- **Lista de adiciones y de suspensiones, con fecha y motivo.** Los conjuntos `cb9c-h8sn` (adiciones) y `u99c-7mfm` (suspensiones) no están en el catálogo de la ingesta. Además, adiciones no trae el monto y sus etiquetas «Suspensión» y «Reactivación» vienen invertidas (`docs/investigacion-ingesta.md`). Hoy solo se puede mostrar el resumen: cuánto subió el valor, cuántos días se agregaron y si está suspendido.
- **Señales** (TASK-13) y **obra a la que pertenece** (BPIN, DNP).
- **Pagos de SECOP I** (no existen en la fuente).

## Datos sensibles

- El 85 % de los contratos de SECOP II y el 75 % de los de SECOP I son con **personas naturales**. Silver ya deja vacío su nombre y cambia su documento por un seudónimo (`k1_…`): en la muestra, ninguna persona natural trae nombre (0 de 3,03 M).
- Las personas jurídicas traen razón social y NIT (`nit:<número>`). 6.591 contratos no tienen documento del contratista (`sin_documento`) y tampoco nombre.
- El **objeto** es texto libre y puede nombrar a una persona («prestación de servicios de…»). El criterio de TASK-08 es publicarlo como viene y ocultarlo si llega un reclamo.
- Los ejemplos de este documento y del contrato usan una entidad pública y una junta de acción comunal (persona jurídica). No se escribe ningún nombre de persona natural.

## Sorpresas que cambian el diseño

1. **El retraso no se puede mostrar tal cual.** `retraso_dias` es negativo en 1,45 M de contratos (terminan antes de la fecha original calculada) y hay 67 con más de 10 años, 584 con fin anterior al inicio y 28 con fin después de 2060. La página necesita una regla de qué retraso es creíble, o no mostrarlo hasta TASK-13.
2. **«Vencido sin cierre» es el estado más común** (53 %): la fecha de fin ya pasó y la entidad no cerró el contrato en SECOP. No es una señal; el texto debe decirlo sin alarmar.
3. **`valor_pagado` = 0 significa «no reportado»**, no «no pagado». Solo hay pagos reportados en la mitad de SECOP II y en nada de SECOP I.
4. **El contratista casi siempre es «Persona natural».** La ficha típica no tiene nombre de contratista; el diseño no puede depender de él.
5. **Los textos de origen no son de lectura fácil:** objeto largo y en mayúsculas, modalidades con nombre de ley. Hace falta una forma corta para el público general.
6. **La competencia solo existe en SECOP II**, y en la contratación directa vale 0 por definición.

## Medición del export (2026-11-18)

Con el modelo `contract_detail` sobre el mismo corte: 6.778.189 contratos (5.565.703 con persona natural, 1.202.304 con persona jurídica y 10.182 sin documento). Ninguna persona natural sale con nombre o documento. 110.750 contratos no traen el NIT de la entidad, 401 tienen un valor no confiable y 1 no trae objeto.

## No comprobado

- El comportamiento de la API: no existe todavía.
- Los conjuntos de adiciones y suspensiones: no se descargaron; lo dicho sale de `docs/investigacion-ingesta.md`.
- Si los enlaces `url_proceso` siguen abriendo en SECOP: no se probó ninguno.

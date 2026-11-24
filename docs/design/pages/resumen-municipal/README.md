# Resumen municipal (gasto público del municipio)

Estado: **Aprobada** 2026-11-22 (Aprobación 1 de la spec y Aprobación 2 de la maqueta). Pertenece a TASK-10, Corte 2 (issue #17). Vive dentro de la ficha del mapa ([spec del mapa](../map/spec.md)).

| Paso | Archivo | Estado |
| --- | --- | --- |
| 0. Contrato | [contract.md](contract.md) | Hecho 2026-11-22 |
| 1. Datos | [data.md](data.md) | Hecho 2026-11-22 (CUIPO, corte 30 jun 2026) |
| 2. Spec | [spec.md](spec.md) | Aprobada 2026-11-22 (boceto A · La barra del balance, [bocetos.html](bocetos.html)) |
| 3. Componentes | Guía v1.7.0 | ProgressBar (núcleo, tres tonos de tinta) y LegendKey con claves de tinta, aprobados |
| 4. Maqueta | Storybook `Módulos/Mapa/ResumenMunicipal`, en `src/modules/mapa/ui/ResumenMunicipal/` | Hecha 2026-11-22, 14 historias |
| 5. Validación | [validation.md](validation.md) | Hecha 2026-11-22, 0 fallas |

## Para desarrollo

- Contrato de la interfaz: `ResumenMunicipal` en [contract.md](contract.md). Los datos de muestra reales están en `muestra.ts`.
- «Recibido» es el campo `obligado`; «sin información» nunca es cero; 2021 y 2022 no tienen CUIPO.
- Integrado en la ficha del mapa (commit 704dee1): sustantivo por nivel, `?anio=` con aviso de año inválido, año parcial. Pendiente: prueba automática del foco (falta jsdom o happy-dom; hoy lo cubre la historia `FocusAfterYear`, que `design:check` no ejecuta).

## Preguntas abiertas

Select o botones de año y presupuesto definitivo. Licencia (CC BY-SA 4.0), copiar enlace con año y departamento en la misma sección quedaron resueltos. Ver [spec.md](spec.md) §7.

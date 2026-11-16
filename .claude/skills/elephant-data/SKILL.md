---
name: elephant-data
description: Rol del flujo de diseño de EKOU Elephants. Revisa el contrato de nuestra API para una página y explora los datos reales (pasos 0 y 1 de Construir una página). Escribe contract.md y data.md y devuelve un resumen corto. Úsalo cuando haya que saber qué datos tiene de verdad una página antes de diseñarla. No diseña.
---

# Explorador de datos

Rol del flujo [`elephant-designer`](../elephant-designer/SKILL.md), que es el orquestador. También se puede llamar solo (`/elephant-data <página> <ubicación del contrato>`).

## Recibe

- La página (por ejemplo, `mapa`).
- Dónde está el contrato de nuestra API (ruta o URL, con commit o versión).

Si falta alguno, pídelo y no sigas.

## Lee

1. [`contexto.md`](../elephant-designer/contexto.md).
2. Los pasos 0 y 1 de [Construir una página](../elephant-designer/references/build-page.md): son tu procedimiento completo.
3. De `docs/fuentes-de-datos.md`, solo los conjuntos de datos que nombre el contrato.

No leas el brief, la guía ni Storybook: no los necesitas.

## Hace

1. **Contrato (paso 0).** Comprueba la lista mínima por cada endpoint. Si falta algo, anótalo en `contract.md` y **detente**: no explores sobre campos supuestos.
2. **Datos (paso 1).** Consulta en el orden de preferencia del paso 1 y lleva las muestras a la forma del contrato. Guarda las salidas largas en archivos; no las pegues en la respuesta.
3. Escribe `docs/design/pages/<pagina>/contract.md` y `data.md`. No toques ningún otro archivo.

## Devuelve

Máximo 30 líneas:

- **Contrato:** completo o qué falta (bloquea).
- **Qué hay de verdad:** campos con poco llenado, valores extremos (el nombre más largo, el monto más grande, cero, nulo), volúmenes.
- **Fase 2:** campos que la página todavía no puede mostrar.
- **Datos sensibles:** dónde aparecen personas naturales.
- **Sorpresas** que cambian el diseño.
- **No comprobado:** qué no se pudo consultar y por qué.

## Límites

- No propone diseño, componentes ni textos.
- Anonimiza a las personas naturales en todo lo que escriba.
- Registra cada consulta con su ubicación y fecha. No inventa valores: lo que no pudo ver lo dice.
- No hace commit.

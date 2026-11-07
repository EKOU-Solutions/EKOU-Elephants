# Arquitectura y organización del código

El stack y sus motivos están en el [ADR-0001](adr/0001-arquitectura-inicial.md); los comandos, en [Desarrollo local](desarrollo.md). Esta guía explica cómo organizar cada funcionalidad.

## Módulos verticales

Cada módulo agrupa una capacidad del producto en `src/modules/<modulo>/`: interfaz, reglas, casos de uso y adaptadores. Por ejemplo, `mapa` contiene el flujo de consulta de un resumen territorial.

Una entrega vertical recorre lo necesario para producir un resultado usable: UI → API → caso de uso → persistencia → pruebas. Esto permite que una persona trabaje en una funcionalidad completa sin repartir todo el proyecto en equipos de frontend y backend. Las tareas transversales preparan la base compartida.

```text
src/
  client/                         # Arranque de React y composición de pantallas
  modules/mapa/
    domain/                       # Tipos, conceptos y errores de negocio
    application/
      ports/                      # Contratos de salida que necesita la aplicación
      obtener-resumen-territorial.ts
    adapters/
      http/                       # Rutas Hono
      postgres/                   # Consultas SQL y mapeo de resultados
    ui/                           # Componentes React de la funcionalidad
  server/
    index.ts                      # Entrada del Worker y entorno
    app.ts                        # Montaje de rutas, cabeceras y errores HTTP
    db.ts                         # Acceso técnico a PostgreSQL
    composition/mapa.ts           # Construcción y conexión de dependencias
migrations/                       # Historial SQL común de la base
tests/integration/                # Pruebas con PostgreSQL real
```

Esta estructura refleja el arquetipo actual. Se añadirán componentes compartidos y pruebas E2E cuando hagan falta. Un módulo vertical no implica otro repositorio, servicio o despliegue.

## Puertos y adaptadores

El centro del módulo define lo que hace la aplicación; los adaptadores conectan ese comportamiento con HTTP, PostgreSQL u otros sistemas.

| Parte | Responsabilidad | Ejemplo actual |
| --- | --- | --- |
| Dominio | Conceptos y errores independientes de tecnología. | [ResumenTerritorial y TerritorioNoEncontrado](../src/modules/mapa/domain/resumen-territorial.ts). |
| Aplicación | Ejecutar un caso de uso utilizando sus puertos. | [obtenerResumenTerritorial](../src/modules/mapa/application/obtener-resumen-territorial.ts). |
| Puerto de salida | Definir la información u operación que necesita el caso de uso. | [ConsultarGastoTerritorial](../src/modules/mapa/application/ports/consultar-gasto-territorial.ts): `porCodigo(codigo)`. |
| Adaptador HTTP | Validar la petición, invocar el caso de uso y devolver su resultado. | [mapaRoutes](../src/modules/mapa/adapters/http/mapa.routes.ts). |
| Adaptador PostgreSQL | Implementar el puerto con SQL parametrizado y transformar filas a tipos del módulo. | [gastoTerritorialRepository](../src/modules/mapa/adapters/postgres/gasto-territorial.repository.ts). |
| Composición | Crear las implementaciones y pasarlas a quienes las necesitan. | [componerMapa](../src/server/composition/mapa.ts). |

El caso de uso funciona como entrada a la aplicación; no hace falta crear una interfaz adicional por cada función. Las dependencias se pasan como argumentos, sin un contenedor de inyección.

### Reglas de dependencias

- `domain` no importa Hono, React, PostgreSQL ni configuración del servidor.
- `application` depende del dominio y de sus puertos; no de implementaciones en `adapters` o `server`.
- Los adaptadores dependen de los contratos del centro. El caso de uso recibe `ConsultarGastoTerritorial`, no crea el repositorio ni conoce su SQL.
- `server/composition` conoce las piezas concretas y las conecta. Solo se cambia esta conexión al sustituir un adaptador compatible.
- La UI consulta la API por HTTP. Puede compartir tipos puros mediante `import type`; no importa repositorios, conexiones ni secretos.
- Los módulos no acceden a tablas o adaptadores internos de otro módulo. Una colaboración entre módulos se define mediante un contrato explícito de aplicación.

No hace falta crear clases ni una abstracción para cada archivo. Un puerto se introduce cuando expresa una dependencia del caso de uso que necesitamos sustituir o probar.

## Ejemplo: consultar un territorio

`GET /api/mapa/territorios/05/resumen`

1. La UI solicita el resumen a la API.
2. Hono valida el código DIVIPOLA y llama a `obtenerResumenTerritorial`.
3. El caso de uso consulta `puerto.porCodigo(codigo)`; si no existe el territorio, lanza `TerritorioNoEncontrado`.
4. La implementación PostgreSQL ejecuta la consulta y transforma la fila en `ResumenTerritorial`.
5. Hono devuelve JSON. `server/app.ts` traduce el error de territorio a 404 y los errores inesperados a un 500 genérico.
6. React presenta carga, resultado o error.

Este es el orden de ejecución. La dirección de las dependencias del código sigue las reglas anteriores: el caso de uso solo importa su puerto, aunque la implementación de ese puerto termine consultando PostgreSQL.

La composición existente es:

```ts
const puerto = gastoTerritorialRepository(db);
const consultarResumen = obtenerResumenTerritorial(puerto);
const rutas = mapaRoutes({ obtenerResumenTerritorial: consultarResumen });
```

El resumen actual y las cifras de seed son una demostración del arquetipo; no representan una ingesta real ni cierran las reglas del Mapa Interactivo.

## Cómo añadir una funcionalidad

1. Ubicarla en el módulo dueño de esa capacidad; crear otro módulo si tiene una responsabilidad distinta.
2. Definir su entrada, resultado y reglas en el dominio/aplicación; agregar los puertos de salida necesarios.
3. Implementar HTTP y persistencia como adaptadores y conectarlos en `server/composition`.
4. Incorporar la UI y, si cambia el esquema, una migración SQL en `migrations/`.
5. Verificar el resultado completo: pruebas del caso de uso con un puerto en memoria, pruebas de rutas y pruebas de integración con PostgreSQL cuando corresponda.

Las pruebas unitarias viven junto al archivo probado (`*.test.ts`); las de integración, en `tests/integration/`. Manejo de errores, seguridad y pruebas son parte del DoD de la entrega.

Las utilidades técnicas comunes viven en `server/`; los componentes visuales reutilizables podrán extraerse a `components/ui/` cuando exista reutilización real. La ingesta tiene su decisión y flujo separados.

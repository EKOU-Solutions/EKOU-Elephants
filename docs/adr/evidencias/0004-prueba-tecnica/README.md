# Prueba técnica · ADR-0004

Resultados de la prueba técnica corta del [ADR-0004](../../0004-paginas-de-contratos.md#orden-de-trabajo), medida el 2026-11-21 en la rama `feature/TASK-11-prueba-tecnica`.

## Qué se probó

1. **La web en Astro y la API en su propio Worker.** `ekou-elephants-web` (Astro, `web/`) sirve el mapa, y `ekou-elephants-api` (Hono, `src/server/api.ts`) sirve `/api/*`. En los previews, la web le pasa `/api/*` a la API por un service binding.
2. **El mapa como isla hidratada con Preact.** Astro genera las 1.155 páginas del mapa en el build. La pantalla del mapa es una sola isla que **hidrata** la página, sin reemplazarla.

La medición de CPU de un contrato armado desde la API se hace en la tarea del detalle de contrato (TASK-12). Allí se decide si hace falta el plan de pago.

## Cómo se midió

- **Herramienta:** Lighthouse 13.6.0, con la misma configuración del [ADR](../0004-lighthouse/README.md): móvil, Slow 4G simulado, tres corridas por página, Chrome sin interfaz.
- **Dónde:** los tres Workers (web, API y datos) corriendo juntos en local con `wrangler dev`, con los datos del corte 2026-11 de `datos-locales/`.
- **Límites:** es una medición de laboratorio, no en un celular real, y no pasa por el CDN de Cloudflare.

## Resultados

| | Hoy (ADR) | Con la prueba |
| --- | --- | --- |
| Rendimiento `/mapa` | 100 / 96 / 95 | **100 / 100 / 100** |
| LCP `/mapa` | 0,77 / 2,74 / 2,90 s | **1,7 / 1,5 / 1,5 s** |
| LCP `/mapa/05001` | 0,76 s | 1,5 / 1,6 / 1,5 s |
| Peso de la primera visita `/mapa/05001` | ~250 KB | **81 KB** |
| Peso de la primera visita `/mapa` | ~250 KB | **99 KB** |
| JavaScript | 94 KB (React ~67 KB) | **31 KB** (Preact incluido) |
| JavaScript sin usar | 45–48 KB | 0 KB |
| Accesibilidad y SEO | 100 | 100 |
| Generar las 1.155 páginas | 6,6 s | 9,1 s |

- **El LCP ya no se dispara.** Hoy React borra la página y la vuelve a pintar, y algunas corridas marcan 2,9 s. Con la isla, el nodo que pintó el servidor sigue siendo el mismo después de hidratar (comprobado en el navegador).
- **El LCP de `/mapa/05001` subió de 0,76 a ~1,5 s, pero sigue por debajo de la meta (2,5 s).** El elemento LCP es ahora un texto de la hoja. Vale revisarlo en el PR del mapa.
- **El país completo se descarga solo con intención.** El topojson (95 KB) y las listas de la API llegan cuando la persona toca, desplaza, escribe o enfoca el mapa. Antes de eso la página no pide nada a la API.
- **Buenas prácticas dio 96** por un `favicon.ico` que responde 404. Hoy la SPA respondía esa dirección con su HTML; la app no tiene favicon.

Reportes completos: [mapa-1](mapa-1.html), [mapa-2](mapa-2.html), [mapa-3](mapa-3.html), [mapa_05001-1](mapa_05001-1.html), [mapa_05001-2](mapa_05001-2.html), [mapa_05001-3](mapa_05001-3.html). Se abren igual que los [del ADR](../0004-lighthouse/README.md#cómo-abrirlos).

### Qué lleva cada página

Cada página trae los datos que necesita para dibujarse, y nada más:

- las cifras de su departamento (la página de Colombia, las de todos los municipios);
- solo sus contornos, y las cajas de los municipios que la encuadran.

Las 1.155 páginas pintan exactamente el mismo HTML que con los datos completos (comprobado una por una). Con esto, el build pasa de 444 MB a 73 MB y la página mediana pesa 11 KB comprimida.

### Los Workers

| Worker | Tamaño (gzip) | Corre cuando |
| --- | --- | --- |
| `ekou-elephants-web` | 123 KB | Solo en `/api/*` de los previews. El mapa son archivos estáticos |
| `ekou-elephants-api` | 181 KB | En cada `/api/*` |

En local respondieron bien `/mapa`, `/mapa/05001`, `/api/salud`, `/api/mapa/*`, `/geometria/*`, `/sitemap.xml` y las redirecciones `/` → `/mapa` y `/mapa/departamento/11` → `/mapa/11001`.

## Lo que encontramos

- **Preact funciona con nuestros componentes sin cambiarlos,** incluido `useEffectEvent` de React 19. Con los tipos de Preact, `tsc` marca errores de tipos en `BottomSheet`, `Input` y `MapPage` (eventos y atributos de `input`). Además, `web/` todavía no tiene los tipos de Workers (`Fetcher`, `cloudflare:workers`). Se corrigen en el PR de Preact; la prueba no los toca.
- **`lucide-react` debe pasar por Vite** (`resolve.noExternal`). Si no, al generar las páginas usa el React de verdad y falla.
- **El adaptador de Cloudflare agrega solo un KV de sesiones** (que crearía al desplegar) y un binding de imágenes. Se apagan con `session: false` e `imageService: 'passthrough'`.
- **Sin páginas bajo demanda no sale Worker.** El reparto de `/api/*` en los previews es un endpoint de Astro (`web/src/pages/api/[...path].ts`), no un middleware.
- **Las páginas se generan en Node,** no en workerd (`prerenderEnvironment: 'node'`), porque leen el corte del disco.
- **Lo que hacía la SPA ahora debe hacerlo el sitio:**
  - las redirecciones (ya están);
  - una página 404 para lugares que no existen. Hoy la app muestra «Ese enlace no corresponde…»; ahora sale la 404 por defecto. Pasa por el flujo de diseño;
  - el favicon;
  - publicar Storybook en `/storybook/`, como hace hoy `npm run build`.

## Para repetirla

```bash
npm run datos:local                  # un corte exportado en este computador (o copia datos-locales/)
node web/spike/build.mjs             # genera la web con las 1.155 páginas
npx wrangler dev -c web/dist/server/wrangler.json -c wrangler.api.jsonc \
  -c web/spike/datos.wrangler.jsonc --port 8790
```

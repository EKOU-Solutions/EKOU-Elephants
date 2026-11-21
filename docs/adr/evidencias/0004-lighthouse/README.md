# Evidencias de Lighthouse · ADR-0004

Reportes completos de la medición del 2026-11-21 que cita el [ADR-0004](../../0004-paginas-de-contratos.md#lo-que-medimos-2026-11-21).

## Cómo se midió

- **Herramienta:** Lighthouse 13.6.0, en modo móvil, con la red y el procesador simulados (Slow 4G: 150 ms de latencia, ~1,6 Mbps, procesador 4 veces más lento).
- **Qué se midió:** el build de producción de la app (`vite build`, `index-DPLXQv6U.js`), servido en local con `wrangler dev`. Un Worker de datos local entregaba las 1.155 páginas generadas del corte 2026-11 (`npm run paginas`).
- **Corridas:** tres por página, en Chrome sin interfaz.
- **Límites:** es una medición de laboratorio en un computador, no en un celular real, y no pasa por el CDN de Cloudflare.

## Reportes

| Página | Corrida | Rendimiento | LCP | Reporte |
| --- | --- | --- | --- | --- |
| `/mapa` | 1 | 100 | 0,77 s | [mapa-1.html](mapa-1.html) |
| `/mapa` | 2 | 96 | **2,74 s** | [mapa-2.html](mapa-2.html) |
| `/mapa` | 3 | 95 | **2,90 s** | [mapa-3.html](mapa-3.html) |
| `/mapa/05001` | 1 | 100 | 0,76 s | [mapa_05001-1.html](mapa_05001-1.html) |
| `/mapa/05001` | 2 | 100 | 0,76 s | [mapa_05001-2.html](mapa_05001-2.html) |
| `/mapa/05001` | 3 | 100 | 0,76 s | [mapa_05001-3.html](mapa_05001-3.html) |

Accesibilidad, SEO y buenas prácticas dieron 100 en todas las corridas. Las corridas 2 y 3 de `/mapa` muestran el LCP tardío que causa reemplazar la página en vez de hidratarla. Se ve en la sección «LCP breakdown» de esos reportes.

## Cómo abrirlos

GitHub muestra el código del HTML, no el reporte. Hay dos formas de verlos:

- **En local:** descarga el archivo (o abre el de tu copia del repositorio) y ábrelo con el navegador.
- **En línea:** pega el enlace «Raw» del archivo en un visor de HTML para GitHub, como `htmlpreview.github.io`. Funciona porque el repositorio es público.

Cada reporte trae todo adentro (datos, capturas y estilos) y funciona sin conexión.

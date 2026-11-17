# ADR-0003 · Páginas de cada lugar generadas con Astro en el corte mensual

- **Fecha:** 2026-11-17
- **Estado:** aprobado por el usuario el 2026-11-17 (incluida la publicación del corte con PR y preview); implementación en curso. Los cambios de workflows quedan para una persona del equipo.
- **Tarea:** TASK-09, por pedido del equipo.
- **Complementa:** [ADR-0001](0001-arquitectura-inicial.md) (la app sigue siendo React + Vite) y [ADR-0002](0002-ingesta-de-datos.md) (el corte mensual).

## Contexto

La web es una SPA: quien abre `/mapa/05001` (un buscador, WhatsApp) recibe un `index.html` vacío hasta que corre JavaScript. El enlace a un municipio es el caso principal de uso y es el que peor se indexa y se comparte.

Los datos del mapa solo cambian una vez al mes, con el corte, que ya se publica en el Worker de datos (`ekou-elephants-datos`).

## Decisión

**En cada corte se generan con Astro las páginas de cada lugar como HTML fijo, se publican junto a los datos y la web las sirve. La API y la app no cambian.**

1. **Generar** (`npm run paginas`, script nuevo): con los JSON del corte, Astro genera una página por lugar (`/mapa`, 33 departamentos y 1.122 municipios) y `sitemap.xml`. Cada página lleva en el HTML el nombre, la cifra, la fuente, la fecha del corte, la tabla con enlaces y los metadatos. El contenido se arma con los mismos componentes de React de la pantalla aprobada, así que se ve igual.
2. **Publicar, con revisión humana:** el corte ya no se publica directo en producción. Ver «Publicación del corte con PR y preview».
3. **Servir:** para `/mapa/...`, el Worker de la app busca la página generada en el Worker de datos (binding `DATOS`, servidor a servidor, como ya hace la API). Si la encuentra, le agrega los scripts de la versión actual de la app y la entrega. Si no, entrega la página de siempre.

Al cargar el JavaScript, React monta la pantalla como hoy y el mapa queda interactivo. Como las páginas generadas no llevan scripts propios, una app desplegada después del corte nunca queda desfasada: siempre carga su propia versión.

## Qué cambia y quién lo aprueba

| Pieza | Cambio | Quién |
| --- | --- | --- |
| API (`/api/*`) | Ninguno | — |
| App y despliegue (`vite build`, `scripts/despliegue.mjs`) | Ninguno | — |
| `scripts/paginas.mjs` + Astro como dependencia de desarrollo | Nuevo | Este PR |
| Enrutado del Worker de la app | Para `/mapa/...`, buscar primero la página generada | Este PR |
| `scripts/` (verificación del corte) | Nuevo: el bot de pruebas del corte | Este PR |
| `corte-mensual.yml`, `app-preview.yml`, `app-deploy.yml` | El flujo de «Publicación del corte con PR y preview» | Una persona del equipo (los agentes no tocan `.github/workflows/`); los cambios van escritos en `docs/ci-cd.md` |

## Publicación del corte con PR y preview

Una sincronización con datos dañados no debe llegar sola a producción: dañaría a la vez los datos de la API y las 1.155 páginas. Mientras no haya un bot de verificación probado, cada corte pasa por una persona del equipo (decisión del equipo, 2026-11-17).

1. **El corte abre un PR** («Corte AAAA-MM») en lugar de desplegar en producción. El PR solo cambia una referencia al corte vigente (un archivo pequeño en el repositorio); los JSON siguen en los Releases y las páginas **no** se guardan en Git (unos 29 MB por corte).
2. **El preview del PR** arma la publicación desde los Releases, genera las páginas (`npm run paginas`) y despliega el Worker de datos del PR (`ekou-elephants-datos-pr-<número>`, que `app-preview.yml` ya sabe crear) junto con la app.
3. **El bot de verificación** corre en el PR: están los 33 departamentos y 1.122 municipios; ninguna cifra cae o sube de golpe frente al corte anterior sin explicación (umbral configurable); `/mapa/05001` del preview trae su nombre y su cifra en el HTML; los títulos y descripciones son únicos; y el `design:check` de siempre.
4. **Una persona revisa el preview** y aprueba el PR. Al hacer merge se despliega a producción: Worker de datos con el corte y sus páginas, y la app.
5. **Más adelante**, cuando el bot haya acertado en varios cortes, el equipo puede decidir que apruebe solo; eso es otro ADR.

## Alcance y metas

| Entra | Meta |
| --- | --- |
| HTML del lugar sin JavaScript | Nombre, cifra, fuente, fecha y tabla con enlaces |
| Metadatos por lugar | `<title>`, `description` y `canonical` únicos, `lang="es-CO"`, Open Graph de texto |
| `sitemap.xml` y `robots.txt` | Las 1.155 páginas, con `lastmod` del corte |
| Datos estructurados | JSON-LD `Dataset` con fuente, licencia y fecha del corte |
| Medición | Lighthouse móvil: Rendimiento ≥ 90, Accesibilidad y SEO = 100; LCP ≤ 2,5 s y CLS ≤ 0,1; primera visita ≤ 200 KB con Brotli, como hoy |

**Fuera:** imagen para compartir (trabajo visual, va por el flujo de diseño), encabezados de seguridad y medición con usuarios reales.

Los títulos y descripciones nuevos los lee la gente: pasan por `/ajuste` con la revisión de `elephant-ux`.

## Alternativas descartadas

- **Migrar toda la app a Astro con páginas armadas por petición:** cambia cómo arranca el Worker y el build, y gasta CPU en cada visita, para datos que cambian una vez al mes.
- **Metadatos en el Worker sin generar páginas:** da título y vista previa, pero el contenido sigue dependiendo de JavaScript.
- **Generar las páginas en el build de la app:** el build no tiene los datos del corte, y las páginas quedarían viejas hasta el siguiente despliegue.

## Riesgos

- **Antes del primer corte con el script,** el Worker de datos no tiene páginas y la web sirve la de siempre. No se rompe nada; solo no hay HTML por lugar hasta ese corte (o hasta reprocesar el vigente).
- **Si la pantalla cambia entre cortes,** el HTML inicial puede diferir un poco de lo que monta React hasta el siguiente corte. Se acota regenerando las páginas cuando cambie la pantalla.
- **Peso del Worker de datos:** suma unas 1.155 páginas de pocos KB; se mide con el primer corte.

## Verificación antes de producción

`npm run check` y `npm run deploy:dry-run` en verde (fallas ajenas reportadas); `npm run paginas` con el corte vigente genera las 1.155 páginas; en local, `/mapa/05001` trae «Medellín» y su cifra en el HTML sin JavaScript y el mapa funciona igual que en la Aprobación 2; las metas de la tabla se anotan en el PR con su cifra. Lo que no se cumpla se reporta; no se marca como cumplido.

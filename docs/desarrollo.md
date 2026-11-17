# Desarrollo local

La organización del código, los módulos verticales y los puertos y adaptadores se describen en [Arquitectura](arquitectura.md).

Requisitos: Node.js ≥ 22 y una base PostgreSQL (local con `docker compose up -d --wait`, o una rama de Neon). En macOS: `brew install docker docker-compose colima && colima start`.

```bash
npm install
cp .env.example .env              # DATABASE_URL para migraciones y seed
cp .dev.vars.example .dev.vars    # DATABASE_URL para la API en el runtime de Workers
npm run migrate -- up             # aplica migrations/ (historial en la tabla pgmigrations)
npm run db:seed                   # filas de ejemplo (cifras ficticias)
npm run dev                       # web + API en http://localhost:5173
```

| Comando | Qué hace |
| --- | --- |
| `npm run lint` / `npm run format` | Lint y formato con Biome. `npm run check` corre todo lo que valida CI. |
| `npm run typecheck` | Verifica tipos (cliente y servidor). |
| `npm test` | Pruebas unitarias y de rutas. Las de integración se omiten sin `TEST_DATABASE_URL`. |
| `TEST_DATABASE_URL=… npm test` | Añade integración HTTP → caso de uso → PostgreSQL y migraciones. Usar una base desechable. |
| `npm run build` | Compila cliente y Worker en `dist/`. |
| `npm run migrate -- create nombre` | Crea una migración SQL (`-- Up Migration` / `-- Down Migration`). |
| `npx hono request -P /api/salud scripts/cli-app.ts` | Prueba una ruta con el [Hono CLI](https://hono.dev/docs/agents/cli), sin servidor ni base de datos (datos en memoria). |
| `npm run cf-typegen` | Regenera `worker-configuration.d.ts` tras cambiar `wrangler.jsonc`. |
| `npm run storybook` | Levanta el [sistema de diseño en Storybook](#sistema-de-diseño-storybook) en http://localhost:6006. |
| `npm run build-storybook` | Genera la versión estática de Storybook en `storybook-static/`. |
| `npm run design:check` | Validación de diseño: `build.py` de la guía, build de Storybook y, por cada historia × tema × ancho (320, 390, 768 y 1280 px), render, axe y desplazamiento horizontal. Deja el reporte y las capturas en `.design-check/`. Con `-- --filter <texto>` revisa solo algunas historias. Con `-- --html <archivo>` solo captura un HTML local (los bocetos de una página). Si falta el navegador de Playwright, el comando lo descarga solo la primera vez (unos 100 MB). |

Ruta de prueba: `GET /api/mapa/territorios/05/resumen` (código DIVIPOLA de 2 o 5 dígitos). Es una demostración arquitectónica con cifras ficticias; al tomar el módulo del mapa, se refinarán con Esteban las reglas y el contrato con la ingesta.

La API devuelve los importes como `presupuestoAsignadoCentavos` y `gastoActualCentavos`: enteros exactos, no pesos decimales.

## Páginas de cada lugar (Astro)

Cada corte genera una página HTML por lugar del mapa, con el nombre, la cifra, la fuente, la fecha, la tabla con enlaces y los metadatos ya escritos, para que buscadores y vistas previas de enlaces la lean sin JavaScript ([ADR-0003](adr/0003-migracion-astro.md)). La app sigue siendo React + Vite: Astro solo arma esas páginas, con su configuración aparte en `paginas/`.

| Dónde | Qué hace |
| --- | --- |
| `scripts/paginas.mjs` | `npm run paginas`: lee la carpeta de publicación, ejecuta el build de Astro y deja el resultado en `<carpeta>/paginas/`. |
| `paginas/astro.config.mjs` y `paginas/src/pages/` | Una ruta por tipo de lugar (`mapa.astro`, `mapa/[codigo].astro`, `mapa/departamento/[codigo].astro`) y `sitemap.xml`. |
| `paginas/src/components/Lugar.astro` | La página: metadatos y `MapPage` (la pantalla aprobada) renderizada a HTML con el lugar elegido. Sin scripts propios. |
| `paginas/src/lib/` | Lee el corte con el mismo adaptador y casos de uso que la API (`publicacion.ts`), metadatos, JSON-LD y sitemap (`sitio.ts`) y los textos de `<title>` y `description` (`textos.ts`, aparte para pasar por `/ajuste`). |
| `src/server/paginas.ts` | En el Worker de la app: para `/mapa…` y `/sitemap.xml`, pide la página al binding `DATOS` y le agrega los scripts y estilos de la app; si no hay, entrega la SPA. |

Para generar y probar en local, con un corte en `datos-locales/` (`npm run datos:descargar` o `npm run datos:local`):

```bash
npm run paginas -- --sitio http://localhost:5173   # 1.155 páginas en datos-locales/paginas/ (~40 s)
npm run dev                                         # sirve datos-locales/, páginas incluidas
curl -s http://localhost:5173/mapa/05001 | grep -o '<title>[^<]*</title>'
```

- La URL del sitio es obligatoria (`--sitio` o `EKOU_SITIO_URL`): va en `canonical`, `og:url` y `sitemap.xml`. En local, la del servidor de desarrollo.
- `npm run dev` y `npm run preview` sirven las páginas con el Worker de datos local (`scripts/datos-local.worker.ts`). Si generas páginas con el servidor encendido, reinícialo para que las encuentre. Sin `datos-locales/paginas/`, `/mapa…` entrega la SPA, como en producción antes del primer corte con páginas.
- En Git Bash (Windows), una ruta como `/mapa/05001` en un argumento se convierte en ruta de Windows: usa `MSYS_NO_PATHCONV=1` si pasas `--solo`.
- Las páginas usan los nombres de clase de los CSS Modules de la app (Vite los calcula con el contenido de cada `.module.css`), así que se ven bien con la hoja de estilos de la versión desplegada mientras los estilos de la pantalla no cambien. Si cambian, hay que volver a generar las páginas del corte vigente.
- El HTML lleva un mapa estático (`StaticFullscreenMap`): solo el contorno del departamento con el lugar marcado (en Colombia, el país por departamentos), simplificado (`paginas/src/lib/trazos.ts`, unos 2 KB por página, 15 KB como máximo) y con el mismo encuadre que hará la cámara al montar, así que la página no salta cuando carga la app.
- Pruebas: `paginas/src/lib/sitio.test.ts` (páginas, metadatos y sitemap), `scripts/paginas.test.mjs` (build real de Astro con la muestra de `docs/design/pages/map/sample/`) y `src/server/paginas.test.ts` (enrutado del Worker; Node no trae `HTMLRewriter`, así que la prueba usa uno mínimo y el real se comprueba con `npm run dev` y `curl`).

### Verificar un corte antes de su PR

El corte ya no llega solo a producción: pasa por un PR «Corte AAAA-MM» con preview y revisión de una persona ([CI/CD](ci-cd.md#publicación-del-corte-con-pr-y-preview)). El mismo bot que comenta en ese PR corre en local:

```bash
npm run corte:verificar                                   # datos-locales/: conteos, cambios y páginas
npm run corte:verificar -- --url http://localhost:5173    # además, el sitio (con npm run dev encendido)
npm run corte:verificar -- --anterior <publicación del corte anterior> --umbral 0.1
```

- Imprime el resumen en Markdown y sale con 1 si algo falla. `--anterior` es otra carpeta de publicación (con su `datos/latest.json`). Sin ella, compara con el otro corte de la carpeta si lo hay; `datos-locales/` trae solo uno, así que no compara.
- Para reproducir la publicación del CI: `npm run corte:armar -- --carpeta <ruta>` (baja de los Releases los cortes de `pipeline/worker-datos/corte-vigente.json`; requiere `gh auth login`), `npm run paginas -- --carpeta <ruta> --sitio <URL>` y `npm run corte:verificar -- --carpeta <ruta>`.
- Pruebas: `scripts/corte.test.mjs` (referencia y armado, con `gh` simulado) y `scripts/corte-verificar.test.mjs` (con la muestra de `docs/design/pages/map/sample/`).

## Sistema de diseño (Storybook)

Storybook es la referencia viva del sistema de diseño: lineamientos para personas, fundamentos (color, tipografía, espacio, íconos, voz y tono, formato de datos), accesibilidad y el catálogo de componentes, en tema claro y oscuro.

```bash
npm run storybook          # http://localhost:6006
```

Cada preview de PR y producción publican la versión estática en `/storybook/`: `npm run build` la incluye en `dist/client/storybook/` (ver [CI/CD](ci-cd.md#storybook-en-el-preview-y-en-producción)).

- Configuración y lineamientos: `.storybook/` (páginas MDX en `.storybook/docs/`, especificación de los candidatos en `.storybook/catalog/`). Los componentes del núcleo viven en `src/components/ui/`.
- Los componentes React reales llevan su historia al lado: `src/**/ComponentName.stories.tsx`.
- Los tokens salen de `docs/design/guide/tokens.json`: `build.py` genera `tokens.css` y lo copia, con la fuente, a `src/styles/`. La app (`src/client/main.tsx`) y Storybook importan `src/styles/global.css`; no se edita a mano.
- Cada componente de `src/components/ui/` trae su `Component.module.css` (CSS Modules de Vite); no hay hojas compartidas entre componentes.
- Todo cambio de diseño pasa por la skill `elephant-designer` (regla en `AGENTS.md`). Cómo entra un componente nuevo: página *Cómo trabajamos* dentro de Storybook.
- Storybook quita el plugin de Cloudflare de `vite.config.ts` (`.storybook/main.ts`): solo carga el cliente React, no el Worker.

## Entornos y bases de datos

| Entorno | Base de datos | Archivo | Migraciones |
| --- | --- | --- | --- |
| Local | PostgreSQL en Docker | `.env` y `.dev.vars` | `npm run migrate -- up` |
| Dev | Neon, rama `dev`: base compartida de los previews | `.env.dev` | CI las aplica al integrar en `main` ([CI/CD](ci-cd.md)). A mano: `npm run migrate:dev -- up` (datos de ejemplo: `npm run seed:dev`) |
| Producción | Neon, rama `production` | `.env.production` | CI, tras la aprobación del environment `production` ([CI/CD](ci-cd.md)) |

- Los archivos `.env.*` están fuera de git. Las migraciones en Neon usan `DATABASE_URL_UNPOOLED` (conexión directa); la API usa `DATABASE_URL` (pooler).
- `db:seed` y las pruebas de integración solo se ejecutan contra la base local o desechable, nunca contra `production`.
- La rama `dev` es la base compartida de los previews y el origen de sus copias: debe ser permanente, sin TTL.
- Rama dev: `npx neon checkout dev --create` y copiar las URLs de `npx neon connection-string dev` a `.env.dev`.
- Las migraciones de `dev` y `production` las aplica CI; ver [CI/CD](ci-cd.md).

## Flujo de Git

Trabajamos con *trunk-based development*: `main` es la única rama de larga duración y siempre debe poder desplegarse.

- Cada tarea sale de `main` en una rama corta con el ID de la tarea: `feature/TASK-<nn>-<descripcion-corta>` para funcionalidad y `fix/TASK-<nn>-<descripcion-corta>` para correcciones. Ejemplo: `feature/TASK-04-configurar-ci-cd`.
- El PR se integra en `main` en cuanto pasa CI y la revisión. Títulos de commits y PR en español, con el ID de la tarea.
- La descripción del PR enlaza el issue con `Closes #<número del issue>` para que se cierre al hacer el merge. El cierre depende de esa palabra clave, no del nombre de la rama.
- Cada PR tiene su preview; ver [CI/CD](ci-cd.md).

## Agentes y plugin de Neon (opcional)

No se requiere Claude Code ni el plugin de Neon para contribuir. La configuración compartida no habilita marketplaces ni plugins de terceros.

Quien quiera usar `neon-postgres` puede configurarlo en `.claude/settings.local.json`, ignorado por Git. Por ejemplo:

```json
{
  "extraKnownMarketplaces": {
    "neon": { "source": { "source": "github", "repo": "neondatabase/agent-skills" } }
  },
  "enabledPlugins": { "neon-postgres@neon": true }
}
```

Si el archivo ya existe, integrar estas claves conservando las preferencias locales. El resto de colaboradores no recibe esta configuración.

## Reglas del arquetipo

- `domain` y `application` no importan Hono, `pg` ni Neon; solo `adapters` y `server/composition` los conocen.
- `DATABASE_URL` solo existe en el servidor (`.dev.vars` / secreto de Workers); nunca en el bundle del cliente.
- Los importes del ejemplo se convierten a centavos exactos y se rechazan si su formato o rango es inválido; ver [arquitectura](arquitectura.md#importes-exactitud-y-rechazo-de-datos-incorrectos).
- Consultas siempre parametrizadas; entradas validadas con zod; errores inesperados devuelven un 500 genérico sin detalles.

## Migraciones del ejemplo

La migración territorial original se conserva intacta porque ya se aplicó en bases de desarrollo. La siguiente añade restricciones para que los importes de `gasto_territorial` se representen sin pérdida como centavos enteros. Ejecutar las pendientes normalmente. Si hay importes fuera de rango, la migración falla y deben revisarse; no se redondean ni corrigen automáticamente. El esquema y las reglas definitivos del mapa se refinarán al abordar el módulo.

## Traslado de datos entre bases

Las migraciones recrean el esquema, no los datos. Para mover datos entre PostgreSQL local y Neon:

```bash
pg_dump --data-only --no-owner "$ORIGEN_URL" -t gasto_territorial > datos.sql
psql "$DESTINO_URL" -f datos.sql   # tras `npm run migrate -- up` en el destino
```

## Dependencias y `npm audit`

`npm audit` debe quedar en **0 vulnerabilidades**; no se dejan avisos pendientes en desarrollo. Si una dependencia transitiva trae una versión vulnerable y el paquete que la usa aún no publica la corrección, se fuerza la versión corregida en `overrides` de `package.json`, se comprueba que la API sea compatible y se corren las pruebas que la ejercitan.

| Override | Motivo (2026-11-15) | Lo usan |
| --- | --- | --- |
| `glob` 14.0.3 | GHSA de cancelación con `AbortSignal` (glob 9.0.0–14.0.1) | `node-pg-migrate`, `@vercel/nft` (vía `neon`), docgen de Storybook |
| `minimatch` 11.0.3 | GHSA-g3hv-75wg-m249, denegación de servicio (7.0.0–11.0.0) | `glob` |
| `diff` 5.2.2 | GHSA-73rr-hh4g-fpgx, denegación de servicio (5.0.0–5.2.1) | `neon` |
| `@hono/node-server` ^2.1.6 | Corrección previa del arquetipo | `@hono/cli` |

La API de glob 14 es la misma que la de glob 13 (`glob`, `globSync`, `Glob`). Se verificó con las 44 pruebas, incluidas las de integración con PostgreSQL y las migraciones, y con el build de Storybook. Al actualizar `node-pg-migrate`, `neon` o Storybook, revisa si el override sigue siendo necesario y quítalo cuando el paquete ya traiga la versión corregida.

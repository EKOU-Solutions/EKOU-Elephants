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
| `npm run typecheck` | Verifica tipos (cliente y servidor). |
| `npm test` | Pruebas unitarias y de rutas. Las de integración se omiten sin `TEST_DATABASE_URL`. |
| `TEST_DATABASE_URL=… npm test` | Añade integración HTTP → caso de uso → PostgreSQL y migraciones. Usar una base desechable. |
| `npm run build` | Compila cliente y Worker en `dist/`. |
| `npm run migrate -- create nombre` | Crea una migración SQL (`-- Up Migration` / `-- Down Migration`). |
| `npx hono request -P /api/salud scripts/cli-app.ts` | Prueba una ruta con el [Hono CLI](https://hono.dev/docs/agents/cli), sin servidor ni base de datos (datos en memoria). |
| `npm run cf-typegen` | Regenera `worker-configuration.d.ts` tras cambiar `wrangler.jsonc`. |

Ruta de prueba: `GET /api/mapa/territorios/05/resumen` (código DIVIPOLA de 2 o 5 dígitos).

## Entornos y bases de datos

| Entorno | Base de datos | Archivo | Migraciones |
| --- | --- | --- | --- |
| Local | PostgreSQL en Docker | `.env` y `.dev.vars` | `npm run migrate -- up` |
| Dev | Neon, rama `dev` (desechable, expira a los 7 días) | `.env.dev` | `npm run migrate:dev -- up` (datos de ejemplo: `npm run seed:dev`) |
| Producción | Neon, rama `production` | `.env.production` | `npm run migrate:prod -- up` |

- Los archivos `.env.*` están fuera de git. Las migraciones en Neon usan `DATABASE_URL_UNPOOLED` (conexión directa); la API usa `DATABASE_URL` (pooler).
- `db:seed` y las pruebas de integración solo se ejecutan contra la base local o desechable, nunca contra `production`.
- **La rama `dev` expira el 2026-11-14** (política de `neon.ts`). Antes de esa fecha: recrearla con el comando siguiente y actualizar `.env.dev`, o quitar el TTL en Neon si debe persistir.
- Rama dev: `npx neon checkout dev --create` y copiar las URLs de `npx neon connection-string dev` a `.env.dev`.
- Las migraciones de producción deberían salir de CI (tarea #5) y no de un portátil.

## Agentes y plugin de Neon

El plugin `neon-postgres` (skills y MCP de Neon) está declarado solo para este proyecto en `.claude/settings.json`; Claude Code pedirá confirmarlo al abrirlo. No está instalado a nivel de usuario. `neon init` y `neon plugins` lo instalan para todos tus proyectos: evitar esos comandos o revertirlos con `claude plugin uninstall neon-postgres@neon --scope user`.

## Reglas del arquetipo

- `domain` y `application` no importan Hono, `pg` ni Neon; solo `adapters` y `server/composition` los conocen.
- `DATABASE_URL` solo existe en el servidor (`.dev.vars` / secreto de Workers); nunca en el bundle del cliente.
- Consultas siempre parametrizadas; entradas validadas con zod; errores inesperados devuelven un 500 genérico sin detalles.

## Traslado de datos entre bases

Las migraciones recrean el esquema, no los datos. Para mover datos entre PostgreSQL local y Neon:

```bash
pg_dump --data-only --no-owner "$ORIGEN_URL" -t gasto_territorial > datos.sql
psql "$DESTINO_URL" -f datos.sql   # tras `npm run migrate -- up` en el destino
```

## Avisos de dependencias conocidos

`npm audit` reporta 3 avisos moderados transitivos de `node-pg-migrate` (`glob`/`minimatch`). Es una herramienta de desarrollo que solo lee nuestro directorio `migrations/`; no se ejecuta en Workers ni procesa entrada externa. Revisar al actualizar.

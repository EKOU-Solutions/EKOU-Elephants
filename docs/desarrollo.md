# Desarrollo local

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
| `npm run cf-typegen` | Regenera `worker-configuration.d.ts` tras cambiar `wrangler.jsonc`. |

Ruta de prueba: `GET /api/mapa/territorios/05/resumen` (código DIVIPOLA de 2 o 5 dígitos).

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

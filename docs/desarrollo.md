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

Ruta de prueba: `GET /api/mapa/territorios/05/resumen` (código DIVIPOLA de 2 o 5 dígitos). Es una demostración arquitectónica con cifras ficticias; al tomar el módulo del mapa, se refinarán con Esteban las reglas y el contrato con la ingesta.

La API devuelve los importes como `presupuestoAsignadoCentavos` y `gastoActualCentavos`: enteros exactos, no pesos decimales.

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

## Avisos de dependencias conocidos

`npm audit` reporta 3 avisos moderados transitivos de `node-pg-migrate` (`glob`/`minimatch`). Es una herramienta de desarrollo que solo lee nuestro directorio `migrations/`; no se ejecuta en Workers ni procesa entrada externa. Revisar al actualizar.

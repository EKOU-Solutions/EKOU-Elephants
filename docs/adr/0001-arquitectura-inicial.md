# ADR-0001 · Arquitectura inicial

- **Fecha:** 2026-11-07
- **Estado:** arquitectura y stack aceptados; implementación y verificación del arquetipo pendientes.
- **Tarea:** [Arquitectura y arquetipo · #4](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/4).

## Contexto

Proyecto personal, open source y no comercial, desarrollado por dos personas mediante cortes verticales. Empezamos con una web interactiva y API REST, priorizando servicios gratuitos. La ingesta se define en una tarea y ADR separados.

## Stack y motivos

| Parte | Elección | Motivo |
| --- | --- | --- |
| Frontend | React + Vite + TypeScript | Interactividad con tecnologías conocidas y frontend estático, sin SSR inicial. |
| Backend | Hono en Cloudflare Workers | Integración directa con Workers, TypeScript y posibilidad de ejecutar en Node.js con adaptador. |
| Infraestructura | Cloudflare Workers + Static Assets | Web y API en el mismo dominio, alojamiento estático gratuito y cuota diaria para APIs ligeras. |
| Base de datos | PostgreSQL en Neon | Modelo relacional para cruzar datos y plan gratuito para validar el proyecto. |
| Migraciones | node-pg-migrate con archivos SQL versionados | Reconstruir el esquema en PostgreSQL local o Neon sin adoptar un ORM. |
| Arquitectura | Módulos con puertos y adaptadores | Casos de uso independientes del framework, proveedor y persistencia. |

Aceptamos medir y acotar el trabajo de los endpoints: Workers Free limita la CPU activa por invocación; esperar a Neon no consume ese tiempo. Hono requiere seguimiento de avisos y actualizaciones. Su elección responde al encaje con Workers, no a una garantía de mayor seguridad que Express.

## Alternativas evaluadas

| Alternativa | Motivo de descarte inicial |
| --- | --- |
| Next.js + Vercel | Ofrece integración y más margen de procesamiento por petición, pero priorizamos una web estática con React/Vite y la capa gratuita de Cloudflare. SSR no es requisito inicial. |
| Express | Mayor trayectoria y soporte documentado; Hono encaja directamente con Workers y reduce la adaptación de la capa HTTP. |
| Supabase | Neon ofrece más espacio gratuito de base de datos según los planes consultados; sus servicios adicionales no son necesarios ahora. |
| Railway | El crédito gratuito es limitado para mantener varios servicios; no tenemos un presupuesto de pago acordado. |
| Render PostgreSQL | La base gratuita vence a los 30 días. |

## Migraciones

**Elegimos node-pg-migrate con archivos SQL versionados.** Resuelve solo las migraciones y permite controlar el SQL PostgreSQL sin adoptar un ORM; a cambio, escribimos los cambios explícitamente.

- **Drizzle Kit:** alternativa si queremos definir el esquema en TypeScript y generar migraciones SQL.
- **Prisma Migrate:** alternativa si adoptamos el ecosistema Prisma; añade convenciones de esquema y herramientas que aún no necesitamos.

Se ejecutarán en Node.js local o desde CI, fuera de Workers. Las migraciones recrean el esquema; los datos existentes requieren exportación/restauración aparte.

## DoD del arquetipo

- [x] Frontend y API arrancan localmente con instrucciones y configuración de ejemplo. *(build y runtime de Workers verificados; ver [desarrollo](../desarrollo.md))*
- [ ] Una ruta de prueba verifica el flujo HTTP → caso de uso → adaptador PostgreSQL; dominio y aplicación no dependen de Hono ni Neon.
- [ ] Migraciones reproducibles en PostgreSQL local (verificado: up, idempotente, down, up) y Neon (pendiente), con historial para no reaplicar cambios y procedimiento de traslado de datos.
- [x] Entradas validadas, consultas parametrizadas, secretos solo en servidor y errores controlados.
- [x] Pruebas relevantes de casos de uso, integración y rutas/middleware; dependencias revisadas contra avisos vigentes.
- [x] Compilación y consumo del endpoint comprobados en Workers *(local, workerd; falta contra Neon)*. Automatización de CI/CD y despliegues: tarea #5.

## Scaffold propuesto

```text
src/
  client/
    main.tsx
    App.tsx
  modules/mapa/
    domain/
    application/
      ports/consultar-gasto-territorial.ts
      obtener-resumen-territorial.ts
    adapters/
      http/mapa.routes.ts
      postgres/gasto-territorial.repository.ts
    ui/
      mapa-interactivo.tsx
      resumen-territorial.tsx
  components/ui/
  server/
    index.ts
    db.ts
    env.ts
    composition/mapa.ts
migrations/
scripts/ingestion/
tests/
  integration/
  e2e/
public/
docs/adr/
.env.example
index.html
vite.config.ts
tsconfig.json
package.json
```

Los nombres del módulo son ilustrativos; sus reglas y contratos se definirán después. Los adaptadores de base de datos y secretos quedan fuera del bundle del cliente. Configuración de Cloudflare y de migraciones se añadirá al implementar.

## Referencias

- [Neon: planes](https://neon.com/pricing) y [driver serverless](https://neon.com/docs/serverless/serverless-driver).
- [Supabase: planes](https://supabase.com/pricing), [Cron](https://supabase.com/docs/guides/cron) y [colas](https://supabase.com/docs/guides/queues).
- [Railway: planes](https://railway.com/pricing).
- [Render: limitaciones del plan gratuito](https://render.com/docs/free).
- [Hono](https://hono.dev/docs), [Workers](https://hono.dev/docs/getting-started/cloudflare-workers) y [adaptador Node.js](https://hono.dev/docs/getting-started/nodejs).
- [Express: servidor HTTP de Node.js](https://expressjs.com/en/starter/hello-world/).
- [Cloudflare: compatibilidad HTTP de Node.js](https://developers.cloudflare.com/workers/runtime-apis/nodejs/http/).
- [Next.js: backend para frontend](https://nextjs.org/docs/app/guides/backend-for-frontend).
- [PostgreSQL: exportación/restauración](https://www.postgresql.org/docs/current/backup-dump.html).
- [Cloudflare: límites de Workers](https://developers.cloudflare.com/workers/platform/limits/) y [precios](https://developers.cloudflare.com/workers/platform/pricing/).
- [Vercel: plan Hobby](https://vercel.com/docs/plans/hobby) y [límites de funciones](https://vercel.com/docs/functions/limitations).
- [Next.js: Server y Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components).
- [Cloudflare: React + Vite](https://developers.cloudflare.com/workers/framework-guides/web-apps/react/) y [Static Assets](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/).
- [Hono: avisos de seguridad](https://github.com/honojs/hono/security/advisories) y [página de política](https://github.com/honojs/hono/security/policy).
- [Hono: aviso RegExpRouter](https://github.com/honojs/hono/security/advisories/GHSA-h7mg-cq63-vhpq) y [aviso mount](https://github.com/honojs/hono/security/advisories/GHSA-4m76-xfj5-7975).
- [Hono: secureHeaders](https://hono.dev/docs/middleware/builtin/secure-headers).
- [Express: soporte](https://expressjs.com/en/support/), [política de seguridad](https://github.com/expressjs/express/security/policy) y [recomendaciones de seguridad](https://expressjs.com/en/advanced/best-practice-security/).
- [Express: aviso XSS en redirect](https://github.com/expressjs/express/security/advisories/GHSA-qw6h-vgh9-j6wx).
- [Hono: organización de módulos y handlers](https://hono.dev/docs/guides/best-practices) y [pruebas](https://hono.dev/docs/guides/testing).
- [Hono: repositorio y autores](https://github.com/honojs/hono#authors), [mantenedor principal](https://github.com/sponsors/yusukebe) y [perfil de Yusuke Wada](https://github.com/yusukebe).
- [Express: dependencias del framework](https://github.com/expressjs/express/blob/master/package.json).
- [Next.js: estructura del proyecto](https://nextjs.org/docs/app/getting-started/project-structure) y [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers).
- [Vercel: integración Git y colaboración](https://vercel.com/docs/git) y [límites de cron](https://vercel.com/docs/schedules/cron-jobs/usage-and-pricing).
- [Cloudflare: Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/), [Queues](https://developers.cloudflare.com/queues/platform/pricing/) y [caché](https://developers.cloudflare.com/workers/runtime-apis/cache/).
- [node-pg-migrate: migraciones PostgreSQL](https://salsita.github.io/node-pg-migrate/).
- [Drizzle Kit: migraciones](https://orm.drizzle.team/docs/kit-overview) e [integración con Neon](https://orm.drizzle.team/docs/get-started/neon-new).
- [Prisma: migraciones](https://www.prisma.io/docs/orm/prisma-migrate).

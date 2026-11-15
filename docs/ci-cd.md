# CI/CD de la aplicación

Implementa [TASK-04 · Configurar CI y CD (#5)](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/5) sobre el arquetipo React/Vite + Hono/Workers. El pipeline de datos en Python conserva su propio workflow (`pipeline-ci.yml`).

## En 30 segundos

```mermaid
flowchart LR
  pr[PR abierto o actualizado] --> ci[app-ci: Biome, tipos, pruebas, build]
  ci --> prev[app-preview: Worker de preview en Cloudflare]
  prev --> com[Comentario fijado: URL, base y datos]
  com -- marcar casillas --> prev
  merge[Merge a main] --> ci2[app-ci] --> dev[Migraciones en Neon dev] --> aprob{Aprobación manual} --> prod[Producción: migraciones + Worker]
  cerrar[PR cerrado] --> limpiar[Borrar preview y rama de Neon]
```

| Workflow | Cuándo | Qué hace |
| --- | --- | --- |
| `app-ci.yml` | Lo llaman los otros dos; también manual | Lint y formato con Biome, tipos, pruebas (incluida integración con PostgreSQL 17 desechable), build y validación del paquete de Wrangler. No usa secretos, así que también corre en PRs desde forks. |
| `app-preview.yml` | PR abierto, actualizado, reabierto o cerrado; edición del comentario de control | Despliega el preview del PR, publica y actualiza el comentario fijado y limpia al cerrar. |
| `app-deploy.yml` | Push a `main` | CI, migraciones en la base compartida `dev` y despliegue a producción tras la aprobación. |

## Comprobaciones locales

| Comando | Qué hace |
| --- | --- |
| `npm run lint` | Reglas recomendadas de Biome; las advertencias hacen fallar. |
| `npm run format:check` / `npm run format` | Verifica o aplica el formato de Biome. |
| `npm run check` | Lint, formato, tipos, pruebas y build. Es lo mismo que CI, salvo la integración con PostgreSQL si no hay `TEST_DATABASE_URL`. |
| `npm run deploy:dry-run` | Valida el paquete del Worker sin subirlo (requiere `npm run build`). |

Biome es la única herramienta de lint y formato de la app. Su alcance es `src/`, `tests/`, `scripts/` y la configuración TypeScript/JSON de la raíz. Markdown, SQL y HTML quedan fuera. El pipeline de Python usa Ruff.

## Preview por PR

Cada PR desde una rama de este repositorio (no forks ni Dependabot) despliega un **Preview de Cloudflare Workers** llamado `pr-<número>`, con la app y la API juntas. Al terminar, el workflow publica en el PR un comentario **«Preview de este PR»** e intenta fijarlo.

> Fijar comentarios está documentado para issues (GitHub, febrero de 2026). En PRs no está verificado. Si la API lo rechaza, el comentario queda sin fijar y el log lo avisa.

El comentario muestra la URL, el commit desplegado, la base de datos y el prefijo de R2 que usa el preview. También tiene dos casillas. Al marcar o desmarcar una, se vuelve a desplegar el último commit del PR con esa configuración:

| Casilla | Sin marcar (por defecto) | Marcada |
| --- | --- | --- |
| **Copia propia de la base de datos** | Base compartida `dev` de Neon. No se aplican migraciones. | Rama de Neon `preview/pr-<n>` creada desde `dev`, con las migraciones del PR. Al desmarcarla se borra. |
| **Prefijo de R2 propio** | Variable `DATOS_R2_PREFIJO=datos/` (el corte publicado por TASK-15) | `DATOS_R2_PREFIJO=previews/pr-<n>/datos/`: sube ahí tus archivos modificados con la misma estructura (`latest.json` y `AAAA-MM/`). |

Casos de uso:

- **No cambiaste el backend:** no marques nada. El preview usa `dev`.
- **Cambiaste tablas o migraciones:** marca la copia de la base. Si el PR toca `migrations/` sin la copia, el preview **no se despliega** y el comentario explica por qué. Las migraciones de un PR nunca se aplican a `dev`.
- **Quieres probar datos de R2 modificados** (por ejemplo, municipios del mapa): marca el prefijo propio y sube tus archivos a `previews/pr-<n>/datos/`.

Solo cuenta la edición de alguien con permiso de escritura en el repositorio. La lectura de opciones y la gestión del comentario usan el código de `main`, no el del PR. Al cerrar el PR se borran el preview de Cloudflare y la rama de Neon. Los archivos bajo `previews/pr-<n>/` en R2 **no se borran automáticamente** (pendiente).

**Pendiente con TASK-09 (#16):** hoy la API lee PostgreSQL y el adaptador de R2 no existe. El workflow ya inyecta `DATOS_R2_PREFIJO`, con la misma estructura que publica el corte mensual de TASK-15 (PR #26): `latest.json` apunta al corte vigente en `AAAA-MM/`. El adaptador R2 de #16 debe leer bajo ese prefijo. Falta decidir en #16 si, cuando falte un archivo en el prefijo del PR, se usa el de `datos/`. Previews y producción comparten el bucket de TASK-15; los previews solo leen.

## Producción

Con cada push a `main` (tras el merge de un PR):

1. Se ejecuta `app-ci`.
2. Se aplican las migraciones nuevas en la base compartida `dev`, para que los previews siguientes la encuentren al día.
3. El job `produccion` espera la **aprobación manual** del environment `production`. Al aprobarlo, aplica las migraciones en la rama `production` de Neon y despliega el Worker con `wrangler deploy`.

Una migración fallida detiene el despliegue. Un despliegue fallido **no revierte** las migraciones ya aplicadas, así que las migraciones deben ser aditivas y compatibles con la versión anterior. Para revertir código, haz un PR que revierta el cambio y vuelve a pasar por el pipeline. El rollback de Cloudflare restaura código, no datos. Tras el primer despliegue real, verifica a mano la SPA, `GET /api/salud` y una ruta que use la base.

## Configuración única (administración del repositorio)

Nada de esto lo crean los archivos del repositorio. Los secretos nunca se escriben en archivos ni en el chat.

1. **Cloudflare (cuenta de EKOU):** crea un token de API con permiso de edición de Workers Scripts (y de R2 cuando exista el bucket), limitado a la cuenta. No le des permisos de DNS.
2. **Neon:** crea una clave de API para crear y borrar ramas del proyecto. La rama `dev` **debe ser permanente** (sin TTL), porque es la base compartida y el origen de las copias.
3. **GitHub → Settings → Environments:**
   - `preview`: secretos `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `NEON_API_KEY`, `DATABASE_URL_DEV` (pooler de `dev`) y `DATABASE_URL_DEV_UNPOOLED` (conexión directa de `dev`).
   - `production`: **revisores obligatorios** y despliegue solo desde `main`. Secretos `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `DATABASE_URL` y `DATABASE_URL_UNPOOLED` de la rama `production`.
4. **Variables del repositorio:** `NEON_PROJECT_ID`, `NEON_DATABASE` y `NEON_ROLE`. Después, `PREVIEW_DEPLOY_ENABLED=true` y, solo cuando el paso 3 esté listo, `PRODUCTION_DEPLOY_ENABLED=true`. Sin estas banderas no se despliega nada.
5. **Protección de `main`:** exige el check «Calidad de la app» y el del pipeline.

El primer PR que agrega estos workflows no puede desplegar su propio preview, porque los scripts de control se leen desde `main`. Los previews funcionan a partir del merge.

## Referencias

Verificado el 2026-11-15 con Biome 2.6.8 y Wrangler 4.158.0 instalados, actionlint 1.7.7 y las etiquetas de las acciones (`actions/checkout` v7.0.1, `actions/setup-node` v6.5.0, `neondatabase/create-branch-action` v6.4.0 y `delete-branch-action` v3.2.1, fijadas por SHA).

- [Configuración de Biome](https://biomejs.dev/reference/configuration/)
- [Secretos de Workers subidos con el código](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Permisos de Wrangler](https://developers.cloudflare.com/workers/authorization/workers/#wrangler)
- [Environments y revisores en GitHub](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
- [Comentarios fijados en issues (changelog de GitHub, 2026-02-05)](https://github.blog/changelog/2026-02-05-pinned-comments-on-github-issues/)
- [neondatabase/create-branch-action](https://github.com/neondatabase/create-branch-action)

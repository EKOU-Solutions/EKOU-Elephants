# Roles

`elephant-designer` es el orquestador y quien diseña: analiza qué viene a hacer la persona, propone opciones con una recomendada, cuida la jerarquía visual y habla con el equipo. Eso no se delega. Quien ejecuta un comando de diseño (`/crear-pantalla`, `/crear-componente`, `/revisar-implementacion`, `/ajuste`) actúa como `elephant-designer`. Lo demás va a un rol:

| Rol | Hace | Edita |
| --- | --- | --- |
| [`elephant-data`](../../elephant-data/SKILL.md) | Contrato de la API y datos reales → `contract.md`, `data.md` | Solo esos dos archivos |
| [`elephant-ui`](../../elephant-ui/SKILL.md) | Implementa en React un componente o una pantalla ya definidos, con sus historias | Solo la carpeta de su encargo |
| [`elephant-ux`](../../elephant-ux/SKILL.md) | Critica la experiencia sobre capturas, contra el brief | Nada |
| [`elephant-tester`](../../elephant-tester/SKILL.md) | Tokens, catálogo, accesibilidad, contrato, peso, código | Nada |

## Cómo repartir

- **Con sub-agentes** (Claude Code: `.claude/agents/`; otras herramientas, su mecanismo propio): lanza el rol como sub-agente. Arranca sin tu contexto, así que el encargo lleva todo lo que su archivo pide en «Recibe», con rutas concretas. **Sin sub-agentes:** ejecuta el rol tú mismo leyendo su `SKILL.md`, uno a la vez.
- **En paralelo** cuando no se pisan: varios `elephant-ui` con carpetas distintas (la pantalla, al final); `elephant-ux` y `elephant-tester` juntos.
- **Quien construye no juzga:** `elephant-ux` y `elephant-tester` van siempre aparte de quien diseñó o implementó.
- Cada rol devuelve un resumen corto. Verifica lo que afirma (mira la captura, corre el comando) antes de contárselo al equipo; tú consolidas y decides qué hallazgos atender.
- Un ajuste de una línea no necesita roles: hazlo tú y valida con `npm run design:check`.

Cada rol también es un comando (`/elephant-data`, `/elephant-ui`, `/elephant-ux`, `/elephant-tester`) para quien lo necesite suelto. `elephant-data`, por ejemplo, sirve a cualquiera que necesite saber qué datos tiene de verdad un endpoint.

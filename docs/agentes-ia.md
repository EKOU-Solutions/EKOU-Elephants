# Agentes de IA en GitHub

Fuentes consultadas el 2026-11-15. Lo marcado `sin verificar` no se pudo confirmar en documentación oficial.

| Agente | Qué hace | Activación | Ejecución |
|---|---|---|---|
| Claude | Revisar PR, arreglar issue/comentario y abrir PR, feature pequeña | `@claude revisa este PR`, `@claude arregla esto`, `@claude implementa este issue` | GitHub Actions ([agente-claude.yml](../.github/workflows/agente-claude.yml)) |
| Codex | Revisar PR y tareas en la nube | `@codex review`, `@codex arregla este error` | Codex cloud (nube de OpenAI, sin workflow) |
| Google | Descartado: la app gratuita de Gemini Code Assist para GitHub dejó de funcionar (julio de 2026, fuente secundaria) y la acción de Gemini CLI exige clave de API o Vertex, que no usamos | n/a | n/a |

## Flujo
Mención de una persona con escritura → ejecución (Actions o Codex cloud) → comentario o PR abierto.

## Parametrización
- Claude: modelo fijo `claude-sonnet-5-5` y máximo 30 turnos en `claude_args` del workflow; instrucciones persistentes con `--append-system-prompt` o en el propio comentario.
- Codex: solo revisa cuando se menciona `@codex review`. La revisión automática en cada PR está desactivada en chatgpt.com/codex → Settings → Code review; se configura allí, no en el repositorio; instrucciones en el comentario tras `@codex`; entorno y modelo en chatgpt.com/codex (`sin verificar` el detalle del esfuerzo).
- Instrucciones persistentes: [guias-revision.md](guias-revision.md).

## Límites y riesgos (repositorio público)
- Los agentes no modifican `.github/workflows/` ni secretos; los cambios de CI los hace una persona.
- Cuota: la del plan de suscripción de Jouler; las ejecuciones largas la consumen. Tiempo máximo del job: 30 min.
- El workflow ignora a quien no sea OWNER/MEMBER/COLLABORATOR y no usa `pull_request_target`.
- Los secretos no están disponibles en PR de forks; no se debe ampliar este alcance.
- Riesgo: inyección de instrucciones en issues o PR de terceros; revisar siempre el PR que abra el agente.

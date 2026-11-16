# Revisar una implementación

**Lee** (además de [`contexto.md`](../contexto.md)): Nada más: `elephant-ux` y `elephant-tester` leen lo suyo.

Resultado: una lista consolidada de hallazgos de experiencia y de calidad técnica sobre el alcance que diga la persona. Es de **solo lectura**: no cambia nada.

## 0. Confirmar el pedido

| El pedido es… | Va por |
| --- | --- |
| Revisar algo ya construido (página, componente, commit, rama, PR, cambios sin confirmar) | Este flujo |
| Corregir algo | `/ajuste` |
| Juzgar todo el sistema, una ronda o la dirección visual | `/elephant-designer` (Auditoría) |
| Revisar código que no es de interfaz | Las [guías de revisión](../../../../docs/guias-revision.md), no este flujo |

## 1. Definir el alcance

La persona lo define. Tradúcelo a archivos y a historias de Storybook:

| Alcance | Archivos | Historias |
| --- | --- | --- |
| Una página o un módulo | `src/modules/<módulo>/ui/` | `--filter <módulo>` |
| Un componente | Su carpeta | `--filter <componente>` |
| Cambios sin confirmar | `git status --short` y `git diff` | Las de los componentes tocados |
| Un commit | `git show --name-only <commit>` | Las de los componentes tocados |
| Una rama o un PR | `git diff --name-only main...HEAD` | Las de los componentes tocados; con preview publicado, `--url <preview>/storybook` |

Si el alcance no toca interfaz (ningún componente, estilo, historia, token ni texto), dilo y termina. Si cambió un token o un componente UI que usan otros, las historias son todas: barrido completo. Si no queda claro qué revisar, pregunta una vez.

Anuncia en una línea el alcance resuelto: qué archivos y qué historias.

## 2. Validación automática

`npm run design:check` con el filtro del alcance. Guarda la línea de resumen; el reporte y las capturas quedan en `.design-check/`.

## 3. Revisión en paralelo

Lanza a la vez, con el alcance, los archivos y la ubicación de las capturas:

- **`elephant-ux`:** experiencia, jerarquía visual, prueba de 10 segundos, estados, textos.
- **`elephant-tester`:** tokens y catálogo, accesibilidad, historias por estado, contrato, reglas de producto, movimiento reducido, peso, código y pruebas.

Sin sub-agentes, ejecuta los dos roles uno tras otro leyendo su `SKILL.md`.

## 4. Consolidar

Una sola tabla, sin duplicados, ordenada por gravedad:

| # | Hallazgo | Evidencia (captura o archivo y línea) | Rol | Gravedad | Cambio propuesto |

- Gravedad: crítica (engaña, excluye o rompe), moderada (frena o confunde), menor (pulido).
- Verifica cada hallazgo antes de reportarlo: mira la captura o la línea citada. Descarta lo que no se sostenga.
- Lo que choque con una decisión registrada va a **Decisiones necesarias**.
- Termina con: resultado de `design:check`, qué funciona, los tres cambios principales, y qué no se comprobó.

## 5. Qué sigue

Pregunta qué hallazgos atender. Los aceptados van por `/ajuste` (o por `/crear-componente` si piden un componente nuevo). Este flujo no los aplica.

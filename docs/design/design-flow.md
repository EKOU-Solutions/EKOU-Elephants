# Flujo de diseño

Cómo pasa una página de los datos a un diseño aprobado, y cómo trabaja desarrollo con la skill `elephants-design`. Las instrucciones detalladas para agentes están en la skill: [Construir una página](../../.claude/skills/elephants-design/references/build-page.md). Para los cambios pequeños que mantienen la dirección existe la ruta [Ajuste](../../.claude/skills/elephants-design/references/ajuste.md). Todo cambio de diseño pasa por la skill (regla global de `AGENTS.md`).

## En un minuto

- **Una página a la vez (vertical).** No diseñamos todas las páginas por adelantado. Cada página va de su contrato de API a un diseño aprobado antes de que empiece la siguiente.
- **Sin contrato, no hay diseño.** El boleto de entrada es el contrato de **nuestra API**, el que consumen las pantallas. No es el contrato de la fuente de datos abiertos. La API en sí puede seguir en construcción.
- **Nada inventado.** Cada elemento de una página se rastrea hasta un campo del contrato, un componente aprobado y tokens aprobados.
- **Dos aprobaciones humanas por página:** la especificación (qué y en qué orden) y luego el diseño final. Los componentes nuevos necesitan su propia aprobación.
- **Todo componente queda en Storybook** (`npm run storybook`), con su historia y sus estados.

## De dónde vienen los datos

```mermaid
flowchart LR
  OD["Datos abiertos<br/>datos.gov.co (SECOP, DNP…)"] --> ING["Ingesta<br/>(TASK-06)"]
  ING --> DB[("Nuestra base de datos<br/>o archivos JSON")]
  DB --> API["Nuestra API"]
  API --> UI["Pantallas"]
  C["Contrato de nuestra API<br/>(OpenAPI / JSON Schema / TS)"] -. "define" .-> API
  C -. "boleto de entrada" .-> DS["Diseño de la página"]
  DS -. "objetivo visual" .-> UI
```

El diseño depende solo del último tramo: lo que devuelve nuestra API. Los conjuntos de datos de origen importan solo como el origen de cada campo, para que cada cifra pueda citar su fuente y su fecha.

## Dónde vive cada pieza

```mermaid
flowchart LR
  subgraph Guia["docs/design/guide/ (v1.0)"]
    T["tokens.json"] -->|build.py| TC["tokens.css"]
    CC["components.css<br/>+ components.json"]
  end
  SB["Storybook<br/>(.storybook/ + src/**/*.stories.tsx)"]
  API["Contrato de nuestra API"]
  subgraph Pagina["docs/design/pages/{pagina}/"]
    K["contract.md"] --> D["data.md"] --> S["spec.md"] --> M["mockup.html"] --> V["validation.md"]
  end
  API --> K
  TC --> M
  CC --> M
  TC --> SB
  CC --> SB
  S -. "componente nuevo" .-> CC
  S -. "componente nuevo" .-> SB
  M --> APP["Aplicación<br/>(importa tokens.css,<br/>sigue spec.md)"]
```

`tokens.json` es la fuente; `tokens.css` se genera, así que nunca se edita a mano. El catálogo se consulta en Storybook y su fuente es la [guía del sistema de diseño v1.0](guide/README.md); las reglas están en [design-system.md](guide/design-system.md).

## El flujo de una página

```mermaid
flowchart TD
  A["Página por construir"] --> B{"¿Existe el contrato<br/>de la API y está completo?"}
  B -- No --> B1["Detenerse: backend define<br/>o completa el contrato"] --> B
  B -- Sí --> C["1. Explorar los datos<br/>nuestra API → salida de la ingesta<br/>→ ejemplo del contrato"]
  C --> D["2. Definir la página: spec.md<br/>propósito, jerarquía, estados, textos"]
  D --> G1{"Aprobación 1"}
  G1 -- Cambios --> D
  G1 -- Sí --> E{"¿El catálogo tiene<br/>los componentes?"}
  E -- No --> E1["Proponer componente nuevo"] --> E2{"¿Aprobado?"}
  E2 -- Iterar --> E1
  E2 -- Sí --> E3["Agregar al catálogo<br/>CSS, components.json, historia en Storybook"] --> E
  E -- Sí --> F["3. Maqueta<br/>solo tokens + componentes del catálogo<br/>celular + escritorio, claro + oscuro"]
  F --> V["4. Validar<br/>accesibilidad, desbordamiento 320–1280,<br/>detector, textos, prueba de 10 segundos"]
  V --> G2{"Aprobación 2"}
  G2 -- Cambios --> F
  G2 -- Sí --> H["5. Entrega<br/>carpeta de la página en estado Aprobada"]
```

## Qué hace la persona de desarrollo

```mermaid
sequenceDiagram
  autonumber
  actor Dev as Desarrollo
  participant BE as Backend / contrato de nuestra API
  participant Skill as skill elephants-design
  actor PO as Responsable de diseño + equipo

  Dev->>BE: Contrato del endpoint (o endpoints) de la página
  BE-->>Dev: OpenAPI / JSON Schema / tipos TS + ejemplo
  Dev->>Skill: "Construye la página {pagina}" + ubicación del contrato
  Skill->>Skill: 0. Revisar el contrato (bloquea si está incompleto)
  Skill->>Skill: 1. Explorar datos reales o de muestra → data.md
  Skill-->>PO: 2. spec.md (jerarquía, campos → componentes)
  PO-->>Skill: Aprobación 1 (o cambios)
  opt Falta un componente
    Skill-->>PO: Propuesta de componente nuevo
    PO-->>Skill: Aprobado → al catálogo y a Storybook
  end
  Skill->>Skill: 3–4. Maqueta + validación
  Skill-->>PO: mockup.html + validation.md
  PO-->>Skill: Aprobación 2
  Skill-->>Dev: Carpeta de la página aprobada (contrato, spec, maqueta, validación)
  Dev->>Dev: Implementa con tokens.css + clases del catálogo
  Note over Dev,BE: Si el contrato cambia después,<br/>la página vuelve al paso 0
```

## Lista de verificación del contrato (boleto de entrada)

Para cada endpoint que usa una página:

- [ ] Método, ruta y parámetros (incluido el filtro de territorio DANE).
- [ ] Cada campo: tipo, unidad o formato (COP, %, fecha), y si puede ser nulo o faltar.
- [ ] Al menos una respuesta de ejemplo que cumpla el esquema.
- [ ] Fase de cada campo: MVP o fase 2.
- [ ] Origen de cada campo: el id del conjunto de datos del que lo toma la ingesta (ver [fuentes de datos](../fuentes-de-datos.md)), o «calculado» con el dueño de la regla (por ejemplo, TASK-07 para el nivel de riesgo).

## Qué recibe desarrollo

| Archivo | Para qué sirve |
| --- | --- |
| `contract.md` | La versión exacta del contrato de la que depende el diseño |
| `spec.md` | Orden de construcción y jerarquía; la tabla campo → componente → token; cada estado (carga, vacío, «Sin datos», error, fase 2 oculta); textos finales |
| `mockup.html` | Objetivo visual en celular y escritorio, claro y oscuro |
| `validation.md` | Qué se verificó y qué falta comprobar en la aplicación real |
| Historias en Storybook | Cada componente que usa la página, con sus estados y su accesibilidad |

## Reglas que nunca cambian

- Importa `tokens.css`; usa solo variables `--el-*`. Nunca un hex suelto.
- Usa las clases del catálogo (`.el-*`, listadas en `components.json` y documentadas en Storybook). Si falta algo, pídelo a través del flujo; no improvises un componente.
- «Sin datos» nunca se muestra como 0 ni como riesgo bajo. Los datos faltantes usan la trama gris.
- Una señal pide revisar; no es un veredicto. Nada de «corrupción», «robo» ni «sospechoso» en la interfaz. Ningún nombre de persona natural hasta que TASK-08 lo decida.
- Toda cifra muestra su fuente y su fecha.

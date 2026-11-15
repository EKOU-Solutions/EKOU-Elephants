# Datos personales: qué muestra la app y qué no

> Tarea: [TASK-08 Revisión legal del uso de datos personales](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/9) · Estado: **Propuesto** (pendiente de revisión del equipo y de un abogado) · Fecha: 2026-11-15

> **Aviso:** este documento es una revisión hecha por el equipo con base en normas y sentencias públicas. **No es una opinión legal.** Antes del lanzamiento (TASK-18) debe validarlo un abogado o una consulta a la Superintendencia de Industria y Comercio (SIC). Mientras tanto, la app aplica los criterios más conservadores.

## En 1 minuto

- **Que un dato esté en SECOP no lo vuelve libre de usar.** Al republicarlo, EKOU es **responsable del tratamiento** y le aplican los principios de la Ley 1581 de 2012: finalidad, necesidad, circulación restringida, y el deber de atender reclamos.
- **La app nunca muestra cédulas.** Aunque la Corte Constitucional considera la cédula un dato público, no aporta nada a la veeduría ciudadana y facilita suplantaciones.
- **La app no muestra el nombre de ninguna persona natural**: ni de contratistas, ni de representantes legales, ni de servidores públicos. Un contratista persona natural aparece como *"Persona natural"*, con un enlace al proceso en SECOP, donde cualquiera puede verificar el dato en la fuente oficial.
- **Las empresas, consorcios y uniones temporales sí se muestran** con su razón social y NIT.
- **SIRI y conflictos de interés solo se usan de forma agregada**, por entidad o municipio, nunca por persona.
- **Las alertas son señales, no acusaciones.** Cada una enlaza a su metodología y a la fuente. La app lleva un aviso legal y un canal de reclamos.

## 1. Marco legal

| Norma | Qué dice | Qué implica para EKOU |
|---|---|---|
| [Ley 1581 de 2012](https://normograma.dian.gov.co/dian/compilacion/docs/ley_1581_2012.htm), art. 3 | *Dato personal* es "cualquier información vinculada o que pueda asociarse a una o varias personas naturales determinadas o determinables". El *responsable del tratamiento* es quien "decida sobre la base de datos y/o el Tratamiento de los datos". | EKOU decide qué datos de SECOP republica y cómo: **es responsable del tratamiento**. |
| Ley 1581, art. 4 lit. b y f | El tratamiento debe tener una finalidad legítima. "Los datos personales, salvo la información pública, no podrán estar disponibles en Internet" sin control de acceso. | Los datos públicos pueden ir a internet, pero solo los necesarios para la finalidad: la veeduría ciudadana. |
| Ley 1581, art. 10 lit. b | No se necesita autorización del titular para los "datos de naturaleza pública". Quien los usa sigue obligado por la ley. | No hace falta pedir autorización a los contratistas, pero sí cumplir los principios y atender reclamos (art. 15: 15 días hábiles). |
| Ley 1581, art. 2 lit. d | La ley no aplica a "bases de datos y archivos de información periodística y otros contenidos editoriales". | **No nos apoyamos en esta excepción**: EKOU es una herramienta de datos, no un medio. Si un abogado la considera aplicable, sería un margen adicional, no el punto de partida. |
| [Decreto 1377 de 2013](https://normograma.dian.gov.co/dian/compilacion/docs/decreto_1377_2013.htm), art. 3 | Son datos públicos, entre otros, los relativos "a su calidad de comerciante o de servidor público", y los contenidos en "registros públicos, documentos públicos". | El contrato estatal es un documento público y el registro mercantil (RUES) es un registro público. |
| [Corte Constitucional, T-254 de 2024](https://www.corteconstitucional.gov.co/relatoria/2024/t-254-24.htm), párr. 43-45 | El número de cédula es un **dato público** que no requiere autorización para divulgarse. Dirección, celular, correo y lugar de trabajo son semiprivados. La clasificación depende del "contexto y el propósito de su uso". | Mostrar la cédula **no sería ilegal por sí mismo**, pero no es necesario para la finalidad. Domicilios, teléfonos y correos están excluidos. |
| [Ley 1712 de 2014](https://normograma.dian.gov.co/dian/compilacion/docs/ley_1712_2014.htm), art. 9 par. 2 y art. 18 lit. a | Al publicar información de servidores y contratistas, "se omitirá cualquier información que afecte la privacidad y el buen nombre". La intimidad es una excepción al acceso, "bajo las limitaciones propias que impone la condición de servidor público". | Obliga a las entidades, no a EKOU, pero es el estándar de referencia: **transparencia sobre el contrato, no exposición de la persona**. |
| [Ley 1952 de 2019](https://normativa.colpensiones.gov.co/colpensiones/compilacion/docs/ley_1952_2019.htm), art. 238 | El certificado de antecedentes "deberá contener las anotaciones de las sanciones o inhabilidades que se encuentren vigentes". | Una sanción vencida no se certifica, así que **EKOU tampoco la usa**. |
| [Ley 2013 de 2019](https://normas.cra.gov.co/gestor/docs/ley_2013_2019.htm), art. 5 | "Solamente" es pública una lista cerrada de datos de la declaración de bienes, rentas y conflictos de interés de ciertos servidores. | Lo que no está en esa lista, como los datos del cónyuge o de los parientes, **no se publica**. |
| Código de Comercio, art. 26 | El registro mercantil es público. | El representante legal de una empresa es un dato público del RUES, pero mostrarlo junto a una alerta expone a una persona natural (sección 3). |

## 2. Criterio general

Un dato personal llega a la app solo si cumple **las tres condiciones**:

1. **Es público en origen**, porque una norma ordena publicarlo (SECOP, RUES, SIRI).
2. **Es necesario para la veeduría**: sin él, la ciudadanía no podría entender o verificar el uso del dinero público.
3. **Mostrarlo no expone a una persona natural más que la fuente oficial.** Cruzar fuentes, armar rankings o asociar alertas a una persona crea un perfil que no existe en SECOP, y eso sí es un tratamiento nuevo.

El objeto de la veeduría es el dinero, la entidad y el contrato, no las personas naturales. Por eso la app identifica a las personas naturales por el contrato, no por su nombre, y deja la verificación individual a la fuente oficial, a un clic.

## 3. Decisión por tipo de dato

| Dato | En la app | En los datos abiertos publicados | Uso interno (alertas) |
|---|---|---|---|
| **Persona jurídica, consorcio o unión temporal** (razón social y NIT) | ✅ Se muestra, se busca y entra en rankings | ✅ | ✅ |
| **Cédula de persona natural** | ❌ Nunca | ❌ Solo el seudónimo HMAC (`k1_…`) | ✅ Seudonimizada, para cruzar fuentes |
| **Nombre de contratista persona natural** | ❌ Se muestra *"Persona natural"*, con enlace al proceso en SECOP | ❌ | ❌ No hace falta: el cruce se hace con el seudónimo |
| **Personas naturales en rankings y búsqueda** | ❌ No se buscan por nombre ni entran a *Principales contratistas*. Solo aparecen en cifras agregadas, por ejemplo "40 % de los contratos son con personas naturales" | — | ✅ Agregado |
| **Representante legal de una empresa** | ❌ Su nombre no se muestra. Una alerta puede decir "comparte representante legal con otras 3 empresas contratistas" y nombrar **a las empresas** | ❌ | ✅ Seudonimizado |
| **Servidores públicos** (ordenador del gasto, supervisor) | ❌ Se muestran la **entidad** y, si hace falta, el **cargo**, no el nombre | ❌ No se extraen | ❌ |
| **Sanciones disciplinarias (SIRI)** | Solo **agregadas**, por ejemplo "N contratos firmados con contratistas con sanción vigente" por entidad o municipio. Nunca un listado de personas sancionadas | ❌ | ✅ Solo sanciones **vigentes** al corte, cruzadas por seudónimo |
| **Conflictos de interés** (Ley 2013) | Solo **por entidad**: porcentaje de servidores que declararon y porcentaje que reporta posibles conflictos | ❌ | ✅ Agregado |
| Datos del cónyuge, parientes y fideicomisos (conflictos de interés) | ❌ | ❌ | ❌ No se extraen |
| Cuentas bancarias, domicilios, teléfonos y correos | ❌ | ❌ | ❌ No se extraen (ya aplicado en el catálogo) |
| Documentos tipo tarjeta de identidad o registro civil (posibles menores; 522 casos) | ❌ | ❌ | Se tratan como cualquier persona natural. Hay que preguntar a un abogado si deben excluirse del todo |
| **Valor, objeto, fechas, estado y entidad del contrato** | ✅ | ✅ | ✅ |

### Casos borde

- **Consorcios y uniones temporales con nombre de persona** (por ejemplo, "Consorcio Juan Pérez 2025"): se muestran, porque son la parte contratante con nombre propio en el registro público. Si llega un reclamo, se evalúa caso a caso.
- **Empresas unipersonales (SAS) con el nombre del dueño:** son personas jurídicas y se muestran.
- **Objeto del contrato con el nombre de una persona** (por ejemplo, "prestación de servicios de Juan Pérez como…"): es texto libre de origen y no se puede limpiar con certeza. Se publica tal como viene de SECOP, porque describe el contrato. Si llega un reclamo, se oculta el objeto de ese contrato y queda el enlace a SECOP.

## 4. Lo que ya está implementado

- **Catálogo** ([`catalog.py`](../pipeline/src/ekou_pipeline/catalog.py)): no se extraen cuentas bancarias, domicilios, representantes legales, supervisores ni ordenadores del gasto.
- **Silver** (regla S12): el documento de cada persona natural se seudonimiza con HMAC-SHA256 y una clave secreta, y su nombre queda vacío. La prueba de datos [`sin_datos_personales_en_claro`](../pipeline/transform/tests/sin_datos_personales_en_claro.sql) detiene el corte si alguna persona natural queda identificada.
- **Bronze:** guarda los datos en claro, tal como llegan de SECOP. **Nunca se publica.**

## 5. Lo que falta implementar

| # | Pendiente | Dónde |
|---|---|---|
| 1 | Búsqueda por contratista solo para personas jurídicas; ranking de *Principales contratistas* sin personas naturales | Buscador y rankings |
| 2 | Ficha de contrato: persona natural como *"Persona natural"*, con enlace a SECOP | TASK-12 (#19) |
| 3 | Alertas SIRI: solo sanciones vigentes al corte (`fecha_efectos_juridicos` + duración) y solo agregadas | TASK-13 (#20) y TASK-14 (#21) |
| 4 | Conflictos de interés: extraer solo las columnas del indicador por entidad, nunca las del cónyuge, los parientes ni los fideicomisos | Catálogo, cuando se agregue la fuente |
| 5 | Política de tratamiento de datos, canal de reclamos (respuesta en 15 días hábiles) y aviso legal | TASK-17 (#24) |
| 6 | Bronze en la caché de GitHub Actions: cifrarlo, porque en un repositorio público un PR desde un fork puede leer las cachés de `main` | TASK-15 (#22, PR #26) |
| 7 | Revisión de un abogado o consulta a la SIC sobre este documento | Antes de TASK-18 (#25) |

## 6. Aviso legal propuesto para las alertas

Va en la página de metodología (TASK-17) y, en versión corta, junto a cada alerta.

**Versión corta (junto a cada alerta):**

> Esta es una **señal de riesgo** calculada automáticamente con datos públicos de SECOP. **No es una acusación ni prueba de corrupción**: puede tener una explicación legítima. [Cómo se calcula](#) · [Ver en SECOP](#)

**Versión completa (página de metodología):**

> EKOU-Elephants muestra señales de riesgo calculadas a partir de datos públicos oficiales (SECOP I y II, DANE, RUES, Procuraduría), con una metodología pública. Una señal indica que un contrato o una obra tiene características que, según estándares internacionales de contratación abierta, merecen atención ciudadana. **No es una conclusión ni una acusación contra ninguna persona o entidad**, y puede tener una explicación legítima.
>
> Los datos se publican tal como los reportan las entidades, con las correcciones documentadas en la metodología. Pueden tener errores de origen: verifique siempre en la fuente oficial, enlazada en cada contrato.
>
> EKOU no muestra nombres ni documentos de identidad de personas naturales. Si un dato le concierne y considera que es incorrecto o que no debería mostrarse, escríbanos a [canal de reclamos]. Respondemos en un máximo de 15 días hábiles, como establece la Ley 1581 de 2012.

## 7. Preguntas de la tarea, respondidas

| Pregunta | Respuesta |
|---|---|
| ¿Se puede mostrar el nombre o la cédula de un contratista persona natural, si SECOP ya lo publica? | **Es legalmente defendible**, porque es un dato público (T-254 de 2024; art. 10 de la Ley 1581). Aun así, EKOU sigue obligado por los principios de finalidad y necesidad. **Decisión: no se muestran.** La persona aparece como *"Persona natural"*, con enlace a SECOP. |
| ¿Se puede mostrar el representante legal de una empresa contratista? | Es un dato del registro mercantil público, pero asociarlo a alertas expone a una persona natural. **Decisión: no se muestra su nombre.** Se usa seudonimizado para la alerta "representante legal compartido", que nombra a las empresas. |
| ¿Qué datos de SIRI y de conflictos de interés se pueden mostrar por persona y cuáles solo de forma agregada? | **Ninguno por persona.** SIRI, solo sanciones vigentes y en agregado. Conflictos de interés, solo como indicador por entidad. |
| ¿Qué aviso legal o descargo debe tener la app sobre las alertas? | El de la sección 6, junto con una política de tratamiento de datos y un canal de reclamos. |

## Fuentes

- [Ley 1581 de 2012](https://normograma.dian.gov.co/dian/compilacion/docs/ley_1581_2012.htm): protección de datos personales
- [Decreto 1377 de 2013](https://normograma.dian.gov.co/dian/compilacion/docs/decreto_1377_2013.htm): reglamentario de la Ley 1581
- [Ley 1712 de 2014](https://normograma.dian.gov.co/dian/compilacion/docs/ley_1712_2014.htm): transparencia y acceso a la información pública
- [Ley 1952 de 2019](https://normativa.colpensiones.gov.co/colpensiones/compilacion/docs/ley_1952_2019.htm): Código General Disciplinario (art. 238)
- [Ley 2013 de 2019](https://normas.cra.gov.co/gestor/docs/ley_2013_2019.htm): publicación de bienes, rentas y conflictos de interés
- [Corte Constitucional, Sentencia T-254 de 2024](https://www.corteconstitucional.gov.co/relatoria/2024/t-254-24.htm): el número de cédula como dato público
- Datasets revisados: [SIRI `iaeu-rcn6`](https://www.datos.gov.co/resource/iaeu-rcn6.json), [Conflictos de interés `83qu-fqy5`](https://www.datos.gov.co/resource/83qu-fqy5.json), [RUES `c82u-588k`](https://www.datos.gov.co/resource/c82u-588k.json)

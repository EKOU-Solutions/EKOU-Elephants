# EKOU-Elephants

📊 **Fuentes de datos:** ver [docs/fuentes-de-datos.md](docs/fuentes-de-datos.md)

🧭 **Arquitectura de datos:** ver [docs/arquitectura-datos.md](docs/arquitectura-datos.md)

> Tarea: [TASK-01 Definir alcance de negocio del proyecto](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/1)

## Objetivo del proyecto

Crear una aplicación web que muestre, de forma clara y visual, qué pasa con el dinero público. Con gráficos, mapas y otras herramientas fáciles de entender, cualquier persona puede hacer veeduría ciudadana sin perderse entre documentos ni lenguaje técnico.

La meta es que la ciudadanía pueda identificar por sí misma dónde se está usando mal el dinero del Estado y dónde puede haber señales de corrupción.

## Público objetivo

La ciudadanía colombiana. Atendemos dos tipos de público:

1. **Ciudadanía general:** personas sin conocimientos técnicos o con dificultades para usar herramientas digitales e interpretar información pública. Para ellas, la experiencia por defecto es simple y visual: colores, mapas y mensajes en lenguaje cotidiano.
2. **Público interesado:** personas que siguen temas de política y contratación pública, como periodistas, veedurías, estudiantes y líderes comunitarios. Para ellas hay una vista de detalle con la información completa de cada contrato y cada obra.

## Funcionalidades

### Mapa de inversión
Mapa interactivo de Colombia por departamento y municipio. Al seleccionar un territorio muestra:
- Presupuesto asignado frente a gasto actual
- Número total de obras y cuántas tienen señales de retraso
- Nivel de alerta del territorio (ver *Alertas de riesgo*)

Referencia visual: [Mapa de elecciones de la Registraduría](https://www.registraduria.gov.co/-Mapa-elecciones-en-el-mundo-2024-.html)

### Buscador
Búsqueda de contratos y obras por:
- **Entidad:** por ejemplo, *Alcaldía de Medellín* o *Instituto Nacional de Vías (INVÍAS)*
- **Contratista:** por nombre o NIT de la empresa o del consorcio. Mostrar el nombre o la cédula de **personas naturales** depende de la validación legal en [TASK-08](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/9).
- **Obra:** por nombre o código de proyecto (BPIN), por ejemplo, *Construcción puente vehicular*
- **Ubicación:** departamento o municipio

### Seguimiento de obras
Ficha de cada obra con:
- **Avance:** porcentaje de avance físico frente a lo esperado a la fecha
- **Ejecutor:** entidad contratante y contratista
- **Dinero:** valor presupuestado frente a valor gastado, incluidas las adiciones
- **Licitación:** modalidad, quiénes participaron, cuánto ofertó cada uno y quién ganó
- **Estado:** en ejecución, suspendida, terminada, o con señales de retraso
- **Alertas** asociadas a la obra

### Alertas de riesgo
Señales visuales sobre patrones sospechosos, como sobrecostos, obras sin terminar, contratación directa repetida o un solo oferente.
- **En cascada:** una alerta en un contrato u obra también marca a su municipio y a su departamento.
- **Por colores:** cada departamento y municipio se colorea según el porcentaje de sus obras con patrones sospechosos.
- La lista de patrones, cómo se calculan y con qué datos se definen en [TASK-07](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/8).

### Principales contratistas
Ranking de los contratistas con más contratos y más dinero recibido, junto con el estado de sus obras. Sirve para identificar contratistas con muchas obras que no avanzan o con patrones sospechosos.

### Presupuesto por entidad
Visualización clara de en qué gasta su presupuesto cada entidad pública, por sector (salud, educación, vías…).

### Participación ciudadana
- **Retroalimentación:** un canal para que el usuario reporte errores o problemas con la interfaz, la información o la usabilidad.
- **Compartir:** botón para compartir un contrato, una obra o un territorio en redes sociales, con `#EkouElephants` por defecto.
- **Denunciar:** enlaces directos a los canales oficiales de denuncia (Procuraduría, Contraloría, Fiscalía), para que la persona pueda pasar de identificar una irregularidad a denunciarla.

## Reglas de negocio

- **Filtro territorial global:** al seleccionar un departamento o un municipio, todas las vistas se limitan a ese territorio: buscador, obras, entidades, contratistas, presupuesto y alertas. Por ejemplo, con *Medellín* seleccionado solo se ven las obras, las entidades y los contratistas de Medellín. El territorio se identifica con el código DANE.

## Métricas

| Métrica | Qué mide | Dónde aparece |
|---|---|---|
| **Ejecución presupuestal** | Presupuesto asignado frente a gasto actual (lo efectivamente pagado), por entidad y territorio | Mapa de inversión · Presupuesto por entidad · Seguimiento de obras |
| **Contratación** | Monto total contratado y número de contratos | Mapa de inversión · Buscador · Presupuesto por entidad |
| **Modalidad de contratación** | Porcentaje de contratación directa frente a licitación | Presupuesto por entidad · Seguimiento de obras (licitación) · Alertas de riesgo |
| **Principales contratistas** | Contratistas con más contratos o con más dinero recibido | Principales contratistas · Buscador |
| **Obras con problemas** | Obras retrasadas o paralizadas y su valor | Mapa de inversión · Seguimiento de obras · Principales contratistas |
| **Sobrecostos** | Valor inicial frente a valor final del contrato, incluidas las adiciones | Seguimiento de obras · Alertas de riesgo · Principales contratistas |
| **Alertas de riesgo** | Número de alertas y porcentaje de obras con patrones sospechosos, por entidad, municipio y departamento | Mapa de inversión (colores) · Alertas de riesgo · Seguimiento de obras · Principales contratistas |

## Qué esperamos del proyecto

- Que más ciudadanos ejerzan control social sobre el uso del dinero público de una manera intuitiva.
- Que las personas entiendan de verdad cómo se gasta la plata del Estado, sin necesidad de conocimientos técnicos.
- Que la ciudadanía se sienta capaz de identificar y denunciar irregularidades.

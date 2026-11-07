# EKOU-Elephants

📊 **Fuentes de datos:** ver [docs/fuentes-de-datos.md](docs/fuentes-de-datos.md)

> Tarea: [TASK-01 Definir alcance de negocio del proyecto](https://github.com/EKOU-Solutions/EKOU-Elephants/issues/1)

## Objetivo del proyecto

Crear una aplicación web que muestre, de forma clara y visual, qué pasa con el dinero público. Con gráficos, mapas y otras herramientas fáciles de entender, cualquier persona puede hacer veeduría ciudadana sin perderse entre documentos ni lenguaje técnico.

La meta es que la ciudadanía pueda identificar por sí misma dónde se está usando mal el dinero del Estado y dónde puede haber señales de corrupción.

## Público objetivo

La ciudadanía colombiana en general, sobre todo personas sin conocimientos técnicos en finanzas públicas, contratación estatal o análisis de datos. La herramienta debe poder usarla cualquier persona, sin formación previa.

COMMET: separar los dos tipos de publico, 1 publico con falencias en las herramientas e interpretacion de la info, 2 publico interesado en temas de politica - contratos.

## Funcionalidades

- **Mapa de inversión:** mapa interactivo de Colombia que muestra cuánto dinero público se invierte por departamento y municipio.
  Referencia: https://www.registraduria.gov.co/-Mapa-elecciones-en-el-mundo-2024-.html
  
COMMET: definir que información|Metricas vamos a mostrar en este mapa interactivo. ejemplo: presupuesto vs Gasto actual, numero total de obras, una alerta en caso de un patron sospechoso.
 
- **Buscador de contratos:** búsqueda de contratos por entidad, contratista o ubicación.
COMMET: ejemplo de entidad y contratista, sumar obra obra al buscador

- **Seguimiento de obras:** consulta del avance de obras públicas.
  COMMET: detallar eso, que es un seguimiento, qué mostramos por ejemplo: cuanto porcentaje han avanzado, quien ejecuta, cuanto dinero se han gastado vs cuanto se habia presupuesto para la obra. sumar el detalle de la licitación, quienes participaron, quien ganó, estado de la obra.

- **Alertas de riesgo:** señales sobre contratos sospechosos, como sobrecostos, obras sin terminar o contratación directa repetida.
COMMET: cada departamento, municipio u obra que tenga un patron sospechoso recibir una alerta visual, un ejemplo puede ser cuando una obra tiene sobre costo, debe recibir una alerta en el contrato, por ende el municipio y el departamento quedan alertados.
- separar por colores el riesgo en los departamentos y municipios, el color indica el porcentaje de obras con patrones sospechosos.

- **Reportes ciudadanos:** espacio para reportar o comentar posibles irregularidades.
COMMET: separar en 2 funcionalidades: primera, feedback del usuario sobre la interfaz, la información, la usabilidad y/o cualquier error del proyecto y segunda, funcionalidad de compartir para que las personas puedan conversar en redes sociales sobre el tema, poniendo un #EkouElephants por defecto.

- **Principales contratistas**: Mostrar al usuario los principales contratistas con el estado de las obras, para poder identificar cuando un contratista tiene muchas obras que no avanzan o tienen un patron sospechoso (definir los patrones sospechosos).

## Métricas

- **Ejecución presupuestal:** presupuesto asignado frente a ejecutado, por entidad y territorio.
  COMMET: presupuesto vs Gasto actual
- **Contratación:** monto total contratado y número de contratos.
- **Modalidad de contratación:** porcentaje de contratación directa frente a licitación.
- **Principales contratistas:** contratistas con más contratos o con más dinero recibido.
- **Obras con problemas:** obras retrasadas o paralizadas y su valor.
- **Sobrecostos:** valor inicial frente a valor final del contrato, incluidas las adiciones.
- **Alertas de riesgo:** número de alertas por entidad o municipio.

## Qué esperamos del proyecto

- Que más ciudadanos ejerzan control social sobre el uso del dinero público de una manera intuitiva.
- Que las personas entiendan de verdad cómo se gasta la plata del Estado, sin necesidad de conocimientos técnicos.
- Que la ciudadanía se sienta capaz de identificar y denunciar irregularidades.

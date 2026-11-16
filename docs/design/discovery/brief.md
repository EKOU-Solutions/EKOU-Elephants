# Brief de diseño

Fecha: 2026-11-08. Respondido por: Jouler (EKOU), confirmado en la sesión de descubrimiento de diseño. Es la vara de medir de las auditorías y rondas de diseño (ver `.claude/skills/elephant-designer`).

## Audiencias y primeras tareas

- **Público general** (experiencia por defecto): lo primero que logra es el **panorama nacional** (dónde se concentran las señales en Colombia) y luego explora. Fuente: equipo.
- **Público interesado** (periodistas, veedurías, estudiantes, líderes comunitarios): **comparar y verificar** territorios, entidades y contratistas con cifras exactas, fuente y fecha, para poder citar o comprobar una historia. Fuente: equipo.
- Las dos audiencias y sus vistas (vista simple por defecto, vista de detalle completa) vienen del `README.md` del proyecto.

## Dispositivos y nivel de lectura

- **Celular primero**: teléfonos de gama media, datos móviles limitados, contenido que suele llegar compartido por WhatsApp o redes sociales. El escritorio importa sobre todo para periodistas. Fuente: equipo.
- Personas sin conocimientos técnicos o con dificultad para interpretar información pública (`README.md`): lenguaje cotidiano, sin jerga de contratación.

## Voz del riesgo

- Permitido: **directo y movilizador**; decir el hecho con fuerza y con un número («Esta obra lleva 2 años detenida», «Solo una empresa se presentó»). Fuente: equipo.
- Evitar: «corrupción», «robo», «sospechoso» y veredictos o adjetivos similares; nombres de personas naturales (TASK-08); dar a entender que «riesgo bajo» significa que no hay irregularidades. La fuerza viene del hecho y de la cifra, no de un calificativo. Fuente: `visual-direction.md`; límite confirmado por el equipo.

## Señales de confianza

- Mundo visual: **periodismo de datos**, como el especial interactivo de un medio serio. Un titular que dice algo, el mapa como protagonista, cifras grandes con fuente y fecha. Independiente y movilizador, no un portal del gobierno ni un tablero de SaaS. Fuente: equipo. Confirmado el 2026-11-08 al seleccionar la Ronda 05 editorial sobre la Ronda 06, más limpia.
- Toda cifra viaja con su unidad, fuente, periodo y fecha de actualización; la cobertura se muestra aparte (`guide/design-system.md`).

## Restricciones

- Roles de color aceptados: azul para riesgo bajo, amarillo para intermedio, rojo cálido para alto, trama gris para datos insuficientes; ningún umbral inventado hasta TASK-07 (`visual-direction.md`).
- Contraste de texto WCAG AA, controles de 44 px, el color nunca va solo (`guide/design-system.md`).
- Solo servicios gratuitos; presencia contenida de la marca EKOU; textos del producto y documentación del repositorio en español (Colombia).

## Criterios de éxito

- **Prueba de 10 segundos**: una persona sin experiencia mira la pantalla nacional en un celular y en 10 segundos puede decir dónde se concentran las señales, qué significa el color y que no es una acusación. Fuente: equipo.
- Secundario (supuesto, confirmado): una captura de una cifra o del mapa se entiende sola cuando se comparte; la cifra, su significado y su fuente se leen en la captura.

## Preguntas abiertas

- Categorías numéricas de riesgo, etiquetas y la unidad contrato frente a obra (TASK-07).
- Presentación de personas naturales (TASK-08).
- Tipografía: Atkinson Hyperlegible Next frente a la fuente del sistema (Ronda 04). Resuelta el 2026-11-08: Public Sans.

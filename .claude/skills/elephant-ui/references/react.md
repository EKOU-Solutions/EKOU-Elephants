# Calidad del código de interfaz

Lo mínimo que funciona, bien hecho. [Ponytail](ponytail/ponytail.md) decide **cuánto** código se escribe (el menor que resuelve todo el encargo); estas reglas deciden **cómo** queda ese código. Las aplica `elephant-ui` y las comprueba `elephant-tester`.

Si chocan: ganan la especificación y `contexto.md`, luego estas reglas, luego Ponytail. Lo que pide el flujo (una historia por estado, accesibilidad, datos de muestra con la forma del contrato) no es «código de más»: es parte del encargo.

## Componentes

- **Una responsabilidad por componente.** Un componente hace una cosa y se describe en una frase sin «y». Si mezcla dos trabajos (pedir datos y pintar, o dos piezas que cambian por motivos distintos), se parte por trabajo, nunca por número de líneas.
- **Presentación separada de los datos.** Los componentes de `src/components/ui/` y las pantallas reciben todo por props y no llaman a la API. Quien pide los datos es el contenedor o la ruta.
- **Composición, no herencia ni configuración.** Un componente usa a otro (`children`, o una prop que recibe un elemento, como `icon={<Icon name="search" />}`); no copia su marcado ni comparte sus clases. Antes de agregar una prop booleana más, pregunta si es otra variante (`variant`) u otro componente.
- **Props pequeñas y explícitas.** Uniones de literales en lugar de cadenas libres (`variant: 'primary' | 'secondary'`). Sin props «por si acaso». Un componente que envuelve un elemento nativo acepta sus atributos nativos (`ButtonHTMLAttributes`) en lugar de reinventarlos.
- **HTML nativo primero.** `<button>`, `<a href>`, `<label>`, `<table>`; un `div` con `onClick` es un error.

## Estado y efectos

- **El mínimo estado.** Lo que se puede calcular de las props o de otro estado se calcula al renderizar; no se guarda en `useState` ni se sincroniza con `useEffect`.
- **`useEffect` solo para sincronizar con algo externo** (el DOM, un temporizador, una suscripción). No para derivar datos ni para reaccionar a un evento: eso va en el manejador del evento.
- **El estado vive donde se usa**, lo más abajo posible; sube solo cuando dos componentes lo comparten.
- **Sin optimizar a ciegas.** `useMemo`, `useCallback` y `memo` solo con un problema medido.
- **Listas con `key` estable** (un id del dato), nunca el índice si la lista cambia.

## Legibilidad

- **Nombres que dicen qué es:** componentes en `PascalCase`, manejadores `handleX`, props de evento `onX`, booleanos `isX` / `hasX`. Sin abreviaturas.
- **Retornos tempranos** en lugar de condiciones anidadas. Un ternario dentro de otro en JSX se convierte en una variable con nombre o en un componente pequeño.
- **Constantes con nombre, sin números ni textos mágicos.** Un valor con significado va en una constante en `SCREAMING_SNAKE_CASE` junto al componente (`const FILLED_BARS: Record<Level, number> = …`). Los mapas de variante a etiqueta o a clase son objetos tipados (`Record<…>`), no cadenas de `if`. Las medidas y los colores no son constantes de código: son tokens `--el-*`.
- **Una sola fuente por dato.** El formato de cifras sale de `src/components/ui/format.ts`; un texto o una lista que usan dos componentes vive en un solo lugar y se importa.
- **Tipos estrictos.** Sin `any` ni conversiones `as` para callar al compilador. Los datos de muestra se tipan con los tipos del contrato.
- **Comentarios:** solo el porqué que el código no puede mostrar, en inglés y en una línea. La descripción de cada prop (JSDoc) va en español, porque se lee en Storybook.

## Estilos

- Un CSS Module por componente, solo con tokens `--el-*`; clases con nombre de lo que son (`.label`), no de cómo se ven (`.blueText`).
- Las variantes se eligen con una clase (`styles[variant]`), no con estilos en línea. `style={{…}}` solo para un valor que viene de los datos (el ancho de una barra).

## Pruebas

- La lógica con ramas (formato, cálculo, elegir un estado) lleva una prueba pequeña que falle si se rompe. El marcado sin lógica lo cubren las historias y `npm run design:check`.

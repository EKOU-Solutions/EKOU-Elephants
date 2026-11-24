# Resumen municipal · exploración de datos

Fecha: 2026-11-22. Fuente: consultas directas a CUIPO en datos.gov.co (`4f7r-epif` gastos, `9axr-9gnb` ingresos), sin pasar aún por nuestra API (la tabla gold `resumen_municipal` no existe todavía; ver paso 1, opción 3 del flujo). Periodos medidos: `20231201` y `20251201` (cierre de año), solo ámbito A439 municipios (+ A440 Bogotá), vigencia actual, cuenta 2 (gasto total) y cuenta 1 (recaudo). Las salidas crudas están en el directorio temporal de la sesión; no se versionan.

## Qué hay de verdad

| | 2023 (dic) | 2025 (dic) |
| --- | --- | --- |
| Entidades con gasto reportado (A439+A440) | 1.077 | 1.103 |
| Entidades con ingreso reportado | 1.078 | 1.103 |
| De 1.122 municipios del mapa | ≈ 96 % | ≈ 98 % |
| Municipios con gasto en cero | 0 | 0 |
| Municipios con gasto pero sin ingreso | 0 | 0 |

- **2021 y 2022: sin CUIPO.** El selector de año los ofrece (hay SECOP) pero el balance queda «Sin información».
- **Año en curso (2026):** solo hasta el último trimestre publicado (2026-06 en este corte); las cifras son acumuladas a esa fecha y el año **no está completo**. La pantalla debe decirlo.
- **Rezago:** CUIPO publica con ~50 días de retraso; la fecha de corte de CUIPO y la de contratos son distintas y se muestran las dos.

## Valores extremos (2025, vigencia actual, compromisos totales)

- Mayor: «Distrito Especial de Ciencia, Tecnología e Innovación de Medellín» $11.026 mil millones (Cali $6.576 mil millones). En CUIPO ese es el nombre de la entidad; **en pantalla se usa el nombre DIVIPOLA («Medellín»)**, no el de CUIPO. El nombre más largo que puede aparecer es el de DIVIPOLA.
- Menor: Busbanzá $5.676 millones; Sativasur $4.969 millones. Hay que formatear de millones a billones sin romper el ancho a 320 px.
- Ceros: ninguno a nivel de total. Dentro de los rubros sí hay ceros reales (p. ej. San Benito Abad no reporta nada de deuda en reservas): son `0`, no «Sin información».
- Pagado sobre comprometido (mediana 0,93; mínimo 0,06 en 2023, 0,43 en 2025). Un municipio que apenas ha pagado el 6 % de lo comprometido es un caso real que la barra debe poder mostrar.

## Sorpresas que cambian el diseño o el contrato

1. **El gasto comprometido supera lo recibido en 113 municipios (2025) y 204 (2023).** No es un error: el presupuesto también se financia con saldos de años anteriores y crédito, y el compromiso se mide contra el presupuesto, no contra el recaudo. Pero una barra «recibió X, gastó Y» con Y > X parece una contradicción y hay que explicarla en pantalla sin tono de acusación. **Pregunta de diseño y de datos:** ¿mostramos solo el recaudo del año o también el presupuesto definitivo (`d9mu-h6ar`)? No está en el contrato.
2. **Hay `pagado > obligado` en 1 municipio (2025) y en 2 (2023).** El contrato prometía `pagado ≤ obligado ≤ comprometido`. Es un error de reporte de la fuente. Decisión pendiente: el pipeline no corrige (no inventamos) y la prueba dbt pasa a **advertencia**, o se excluye el municipio. Recomendado: mostrar el dato tal cual con aviso y no garantizar la desigualdad en el contrato.
3. **Los tres bloques (vigencia actual, reservas, cuentas por pagar) no suman un solo «gasto del año».** Las reservas y cuentas por pagar son compromisos de años anteriores que se pagan este año. La pantalla los presenta como tres líneas con su explicación, y cualquier total general lo calcula la interfaz y lo nombra distinto de «gasto del año».
4. **Rubros ausentes dentro de reservas/cuentas por pagar** (p. ej. sin deuda): el contrato dice `0/0/0` dentro de un bloque que existe; el bloque entero es `null` si no hay nada.
5. **San Andrés (`88001`)** muestra cifras del departamento-isla (campo `alcance`); Providencia (`88564`) queda sin información.

## Fase 2

- Presupuesto definitivo y cuánto se ejecuta del presupuesto (porcentaje de ejecución).
- Ingresos por fuente (impuestos, transferencias, crédito) y gasto por sector o programa.
- Descentralizados y comparación entre municipios similares.

## Datos sensibles

Ninguna persona natural: CUIPO reporta entidades públicas; SECOP aquí solo aporta cifras agregadas, no nombres de contratistas.

## No comprobado

- Valores de `contratado` por municipio y año (se leerán del export del pipeline cuando exista `resumen_municipal`).
- Medición de 2024 y de 2026-06 (se asume el mismo comportamiento que 2023 y 2025).
- Rubros 2.1/2.2/2.3 de todos los municipios (solo se midió el total y San Benito Abad como caso de cuadre; la prueba de que 2.1+2.2+2.3 = total se hará en dbt).
- Licencia de los datasets de CUIPO.

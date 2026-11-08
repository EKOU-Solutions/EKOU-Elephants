"""Valida los patrones sospechosos de obra (TASK-07, #8) contra un corte real.

Calcula cada bandera sobre la tabla silver `contratos` que produce el pipeline de ingesta
(TASK-06, #7) e imprime las cifras que respaldan docs/patrones-sospechosos.md: universo,
tasa base de cada bandera, evidencia de su umbral, coocurrencia entre banderas y nivel de
alerta por municipio.

Uso, desde la raíz del repositorio y con el corte ya transformado:

    pipeline/.venv/Scripts/python analysis/patrones_sospechosos.py   # Windows
    pipeline/.venv/bin/python analysis/patrones_sospechosos.py       # Linux / macOS

Solo lee la base (read_only); no modifica nada.
"""

from __future__ import annotations

import sys
from pathlib import Path

import duckdb

BASE = Path(__file__).resolve().parents[1] / "pipeline" / "data" / "ekou.duckdb"

# Modalidades donde la ley exige convocatoria pública: ahí un solo oferente es anómalo.
COMPETITIVA = """(
    modalidad ilike '%licitaci%' or modalidad ilike '%selecci%' or modalidad ilike '%subasta%'
    or modalidad ilike '%concurso%' or modalidad ilike '%nima cuant%'
)"""

# Universo: obras reales. El macro es_obra de la ingesta incluye servicios personales con
# UNSPSC 72 (conductores, apoyo administrativo); aquí se excluyen.
UNIVERSO = f"""
create temp table obras as
select
    k.*,
    {COMPETITIVA} as competitiva,
    date_diff('day', k.fecha_inicio, k.fecha_fin_original) as plazo_original,
    date_diff('day', k.fecha_fin_original, k.fecha_fin) as prorroga,
    date_diff('day', p.fecha_publicacion, p.fecha_adjudicacion) as dias_proceso,
    p.precio_base,
    p.valor_adjudicado
from contratos as k
left join stg_secop_procesos as p
    on k.fuente = 'secop_ii' and p.id_del_portafolio = k.proceso_de_compra
where k.es_obra
    and lower(coalesce(k.tipo_contrato, '')) not like 'prestaci%'
    and coalesce(k.justificacion_modalidad, '') not ilike '%profesionales%'
    and k.estado_ejecucion <> 'cancelado'
    and k.anio_firma between 2018 and 2026
"""

BANDERAS = """
create temp table banderas as
with
p10_proceso as (
    select modalidad, anio_firma, quantile_cont(dias_proceso, 0.10) as p10
    from obras
    where fuente = 'secop_ii' and competitiva and dias_proceso >= 0
    group by modalidad, anio_firma
    having count(*) >= 30
),
fraccion as (
    select k.nit_entidad, k.contratista_id, k.fecha_firma
    from obras as k
    join smmlv as s on s.anio = k.anio_firma
    where k.contratista_id is not null and k.modalidad ilike '%nima cuant%' and k.valor_confiable
    group by k.nit_entidad, k.contratista_id, k.fecha_firma
    having count(*) >= 2 and sum(k.valor_actual) > 100 * any_value(s.smmlv)::bigint
),
entidad_anio as (
    select nit_entidad, anio_firma, count(*) as n, sum(valor_actual) as v
    from obras where valor_confiable group by nit_entidad, anio_firma
),
dominante as (
    select c.nit_entidad, c.contratista_id
    from (
        select nit_entidad, anio_firma, contratista_id, sum(valor_actual) as vc
        from obras
        where valor_confiable and contratista_id is not null
        group by nit_entidad, anio_firma, contratista_id
    ) as c
    join entidad_anio as e using (nit_entidad, anio_firma)
    where e.n >= 5 and c.vc / e.v >= 0.5
    group by c.nit_entidad, c.contratista_id
    having count(*) >= 3
)
select
    o.fuente, o.id_contrato, o.cod_mpio_ejecucion, o.cod_dpto_ejecucion, o.confianza_ubicacion,
    o.anio_firma, o.modalidad, o.valor_actual, o.valor_confiable,
    -- P1 oferente único en modalidad competitiva (solo SECOP II publica oferentes)
    o.fuente = 'secop_ii' and o.competitiva and o.proveedores_unicos_con_respuesta = 1
        as p1_oferente_unico,
    -- P2 proceso exprés: por debajo del percentil 10 de su modalidad y año
    o.fuente = 'secop_ii' and o.competitiva and o.dias_proceso >= 0 and o.dias_proceso < t.p10
        as p2_proceso_expres,
    -- P3 adición de valor por encima del tope legal del 50 % (Ley 80, art. 40)
    o.valor_confiable and o.razon_valor > 1.5 as p3_adicion_sobre_tope,
    -- P4 adición agotando el tope (45 % a 50 %)
    o.valor_confiable and o.razon_valor >= 1.45 and o.razon_valor <= 1.5 as p4_adicion_al_tope,
    -- P5 prórroga que más que triplica el plazo (solo SECOP II actualiza la fecha de fin)
    o.fuente = 'secop_ii' and o.plazo_original > 0 and o.prorroga > 2 * o.plazo_original
        as p5_prorroga_excesiva,
    -- P6 fraccionamiento: varias mínimas cuantías el mismo día al mismo contratista
    f.nit_entidad is not null as p6_fraccionamiento,
    -- P7 contratista dominante 3 años o más en la misma entidad
    d.nit_entidad is not null as p7_contratista_dominante,
    -- Seguimiento (no sospecha por sí sola)
    o.justificacion_modalidad ilike '%urgencia%' as s1_urgencia_manifiesta,
    o.estado_ejecucion = 'suspendido' as s2_suspendida,
    -- Insumos de validación
    o.competitiva, o.precio_base, o.valor_adjudicado, o.proveedores_unicos_con_respuesta,
    o.proceso_con_varios_contratos
from obras as o
left join p10_proceso as t using (modalidad, anio_firma)
left join fraccion as f
    on f.nit_entidad = o.nit_entidad and f.contratista_id = o.contratista_id
    and f.fecha_firma = o.fecha_firma and o.modalidad ilike '%nima cuant%'
left join dominante as d
    on d.nit_entidad = o.nit_entidad and d.contratista_id = o.contratista_id
"""

PATRONES = [
    "p1_oferente_unico",
    "p2_proceso_expres",
    "p3_adicion_sobre_tope",
    "p4_adicion_al_tope",
    "p5_prorroga_excesiva",
    "p6_fraccionamiento",
    "p7_contratista_dominante",
    "s1_urgencia_manifiesta",
    "s2_suspendida",
]
CONTRACCION = 5
GRAVES = ["p3_adicion_sobre_tope", "p6_fraccionamiento", "p7_contratista_dominante"]
MEDIAS = [
    "p1_oferente_unico",
    "p2_proceso_expres",
    "p4_adicion_al_tope",
    "p5_prorroga_excesiva",
]


def titulo(texto: str) -> None:
    print(f"\n## {texto}")


def tabla(con: duckdb.DuckDBPyConnection, sql: str) -> None:
    con.sql(sql).show(max_width=200, max_rows=60)


def main() -> int:
    if not BASE.exists():
        print(
            f"No existe {BASE}. Corre primero la ingesta (pipeline/README.md).",
            file=sys.stderr,
        )
        return 1
    con = duckdb.connect(str(BASE), read_only=True)
    con.execute("set enable_progress_bar = false")
    corte = con.execute("select any_value(corte) from contratos").fetchone()
    print(f"Corte: {corte[0] if corte else '?'}")
    con.execute(UNIVERSO)
    con.execute(BANDERAS)

    titulo("Universo: obras firmadas 2018-2026")
    tabla(
        con,
        """
        select fuente, count(*) as obras,
               round(sum(valor_actual) filter (where valor_confiable) / 1e12, 1) as billones
        from banderas group by fuente order by fuente""",
    )

    titulo("Tasa base de cada patrón (% de obras donde el patrón es calculable)")
    filas = []
    for p in PATRONES:
        filas.append(f"""
            select '{p}' as patron, fuente,
                   count(*) filter (where {p}) as obras,
                   round(100.0 * count(*) filter (where {p}) / count(*), 2) as pct,
                   round(sum(valor_actual) filter (where {p} and valor_confiable) / 1e9, 0)
                       as mil_millones
            from banderas group by fuente""")
    tabla(con, " union all ".join(filas) + " order by patron, fuente")

    titulo(
        "P3/P4: amontonamiento junto al tope legal de adiciones (razón valor final / inicial)"
    )
    tabla(
        con,
        """
        select fuente,
               count(*) filter (where razon_valor > 1.40 and razon_valor <= 1.45) as "1,40-1,45",
               count(*) filter (where razon_valor > 1.45 and razon_valor <= 1.50) as "1,45-1,50",
               count(*) filter (where razon_valor > 1.50 and razon_valor <= 1.55) as "1,50-1,55"
        from obras where valor_confiable group by fuente order by fuente""",
    )

    titulo(
        "P1: descuento frente al presupuesto oficial, con y sin competencia (SECOP II)"
    )
    con.execute("""
        create temp table descuentos as
        select modalidad, anio_firma, precio_base, p1_oferente_unico as unico,
               1 - valor_adjudicado / precio_base as descuento,
               ntile(10) over (partition by modalidad order by precio_base) as decil
        from banderas
        where fuente = 'secop_ii' and competitiva and valor_confiable
          and not proceso_con_varios_contratos and proveedores_unicos_con_respuesta >= 1
          and precio_base > 0 and valor_adjudicado > 0
          and 1 - valor_adjudicado / precio_base between -0.2 and 0.5""")
    tabla(
        con,
        """
        select modalidad, count(*) as procesos,
               round(100 * median(descuento) filter (where unico), 2) as mediana_unico,
               round(100 * median(descuento) filter (where not unico), 2) as mediana_competido,
               round(100 * avg((descuento < 0.01)::int) filter (where unico), 1)
                   as pct_al_presupuesto_unico,
               round(100 * avg((descuento < 0.01)::int) filter (where not unico), 1)
                   as pct_al_presupuesto_competido
        from descuentos group by modalidad having count(*) >= 500 order by procesos desc""",
    )
    tabla(
        con,
        """
        with e as (
            select modalidad, anio_firma, decil, avg(descuento) filter (where not unico) as d0
            from descuentos group by modalidad, anio_firma, decil
        )
        select count(*) filter (where d.unico) as obras_oferente_unico,
               round(sum(d.precio_base) filter (where d.unico) / 1e12, 2) as billones_adjudicados,
               round(sum(d.precio_base * (e.d0 - d.descuento))
                     filter (where d.unico and e.d0 is not null) / 1e9, 0)
                   as sobrecosto_estimado_mil_millones
        from descuentos as d join e using (modalidad, anio_firma, decil)""",
    )

    titulo(
        "Validez de constructo: coocurrencia entre patrones (lift = P(A y B) / P(A)P(B))"
    )
    pares = []
    for i, a in enumerate(PATRONES[:7]):
        for b in PATRONES[i + 1 : 7]:
            pares.append(f"""
                select '{a}' as a, '{b}' as b, count(*) filter (where {a} and {b}) as ambos,
                       round(avg(({a} and {b})::int)
                             / nullif(avg({a}::int) * avg({b}::int), 0), 2) as lift
                from banderas where fuente = 'secop_ii'""")
    tabla(
        con,
        "select * from ("
        + " union all ".join(pares)
        + ") where ambos >= 20 order by lift desc",
    )

    titulo("Nivel de alerta por obra")
    graves = " or ".join(GRAVES)
    medias = " + ".join(f"{m}::int" for m in MEDIAS)
    con.execute(f"""
        create temp table alertas as
        select *, case when {graves} then 'alta'
                       when ({medias}) >= 2 then 'media'
                       when ({medias}) = 1 then 'baja'
                       else 'sin_alerta' end as nivel
        from banderas""")
    tabla(
        con,
        """
        select fuente, nivel, count(*) as obras,
               round(100.0 * count(*) / sum(count(*)) over (partition by fuente), 1) as pct
        from alertas group by fuente, nivel order by fuente, nivel""",
    )

    titulo(
        "Nivel municipal: alertas observadas frente a esperadas (estandarización indirecta)"
    )
    alguna = " or ".join(PATRONES[:7])
    con.execute(f"""
        create temp table esperado as
        select fuente, competitiva, anio_firma, avg(({alguna})::int) as tasa
        from banderas group by fuente, competitiva, anio_firma""")
    con.execute(f"""
        create temp table municipios as
        select b.cod_mpio_ejecucion as cod_mpio, count(*) as obras,
               avg((b.fuente = 'secop_i')::int) as participacion_secop_i,
               count(*) filter (where {alguna}) as observadas,
               avg(({alguna})::int) as tasa_cruda,
               sum(e.tasa) as esperadas,
               -- Contracción bayesiana: 5 alertas "virtuales" en la razón esperada (1,0),
               -- para que un municipio con 3 obras no salte a 3x por azar.
               (count(*) filter (where {alguna}) + {CONTRACCION}) / (sum(e.tasa) + {CONTRACCION})
                   as razon
        from banderas as b
        join esperado as e using (fuente, competitiva, anio_firma)
        where b.cod_mpio_ejecucion is not null
          and b.confianza_ubicacion in ('alta', 'media_alta', 'media')
        group by b.cod_mpio_ejecucion""")
    print(
        "Sesgo por plataforma: correlación entre % de obras en SECOP I y la medida municipal"
    )
    tabla(
        con,
        """
        select round(corr(participacion_secop_i, tasa_cruda), 2) as con_tasa_cruda,
               round(corr(participacion_secop_i, razon), 2) as con_razon_estandarizada
        from municipios where obras >= 20""",
    )
    tabla(
        con,
        """
        select case when razon < 0.8 then '1. menos de 0,8x'
                    when razon < 1.25 then '2. 0,8x a 1,25x (lo esperado)'
                    when razon < 2 then '3. 1,25x a 2x'
                    else '4. 2x o más' end as nivel,
               count(*) as municipios, round(median(obras)) as mediana_obras
        from municipios group by nivel order by nivel""",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

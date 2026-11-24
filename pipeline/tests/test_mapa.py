import json
import tarfile
from datetime import UTC, date, datetime
from pathlib import Path
from typing import Any

import duckdb
import pyarrow as pa
import pyarrow.parquet as pq
import pytest

from ekou_pipeline.cli import main
from ekou_pipeline.mapa import export_mapa, fecha_de_los_datos, nombre_visible


@pytest.mark.parametrize(
    ("oficial", "visible"),
    [
        ("MEDELLÍN", "Medellín"),
        ("VILLA DE SAN DIEGO DE UBATÉ", "Villa de San Diego de Ubaté"),
        ("BOGOTÁ, D.C.", "Bogotá, D.C."),
        ("EL CARMEN DE VIBORAL", "El Carmen de Viboral"),
        ("LA GUAJIRA", "La Guajira"),
        ("SOTARÁ - PAISPAMBA", "Sotará - Paispamba"),
        (
            "ARCHIPIÉLAGO DE SAN ANDRÉS, PROVIDENCIA Y SANTA CATALINA",
            "Archipiélago de San Andrés, Providencia y Santa Catalina",
        ),
        ("GÜICÁN DE LA SIERRA", "Güicán de la Sierra"),
        ("NORTE DE  SANTANDER", "Norte de Santander"),
    ],
)
def test_official_names_become_readable(oficial: str, visible: str) -> None:
    assert nombre_visible(oficial) == visible


def _bronze(data_dir: Path, extracciones: dict[str, str], corte: str = "2026-11") -> None:
    for fuente, extraido_en in extracciones.items():
        ruta = data_dir / "bronze" / f"corte={corte}" / f"fuente={fuente}" / "particion=todo"
        ruta.mkdir(parents=True)
        pq.write_table(pa.table({"_extraido_en": [extraido_en]}), ruta / "part-00000.parquet")


def test_data_date_is_the_oldest_extraction_in_colombian_time(tmp_path: Path) -> None:
    # 00:30 UTC del 8 de noviembre son las 19:30 del 7 de noviembre en Colombia.
    _bronze(
        tmp_path,
        {
            "divipola": "2026-11-08T00:30:35+00:00",
            "secop_contratos": "2026-11-08T00:49:03+00:00",
            "secop_i": "2026-11-09T15:00:00+00:00",
        },
    )
    with duckdb.connect() as conn:
        assert fecha_de_los_datos(conn, tmp_path / "bronze", "2026-11") == date(2026, 11, 7)


def test_data_date_requires_bronze(tmp_path: Path) -> None:
    _bronze(tmp_path, {"divipola": "2026-10-02T00:00:00+00:00"}, corte="2026-10")
    with duckdb.connect() as conn, pytest.raises(ValueError, match="2026-11"):
        fecha_de_los_datos(conn, tmp_path / "bronze", "2026-11")


def _warehouse(path: Path, corte: str = "2026-11") -> None:
    with duckdb.connect(str(path)) as conn:
        conn.execute(
            """
            create table mapa_municipios_corte as
            select * from (values
                ('05001', 'MEDELLÍN', 'municipio', '05', 'CO-ANT', 'ANTIOQUIA', 2021, 2026, 640861),
                ('81001', 'ARAUCA', 'municipio', '81', 'CO-ARA', 'ARAUCA', 2021, 2026, null)
            ) t(cod_mpio, nom_mpio, tipo, cod_dpto, iso_3166_2, nom_dpto,
                ventana_desde, ventana_hasta, contratos_ubicados)
            """
        )
        conn.execute("alter table mapa_municipios_corte add column corte varchar")
        conn.execute("update mapa_municipios_corte set corte = ?", [corte])
        conn.execute(
            """
            create table mapa_niveles_corte as
            select *, 2021 as ventana_desde, 2026 as ventana_hasta, ? as corte from (values
                ('municipio', '05', 640861),
                ('departamento', '05', 25000),
                ('departamento', '81', 1200),
                ('sin_lugar', null, 300)
            ) t(nivel, cod_dpto, contratos)
            """,
            [corte],
        )
        conn.execute(
            """
            create table resumen_gasto_cuipo as
            select nivel, cod_dpto, cod_mpio, alcance, anio, cast(periodo as date) as periodo,
                   vigencia, rubro, comprometido, obligado, pagado, recibido
            from (values
                -- Medellín 2025: cerrado; deuda no reportada (0/0/0 dentro del bloque que existe)
                ('municipio', '05', '05001', 'municipio', 2025, '2025-12-01', 1, 'funcionamiento',
                 100.0, 90.0, 80.0, 500.0),
                ('municipio', '05', '05001', 'municipio', 2025, '2025-12-01', 1, 'inversion',
                 300.0, 250.0, 250.0, 500.0),
                ('municipio', '05', '05001', 'municipio', 2025, '2025-12-01', 2, 'inversion',
                 40.0, 30.0, 30.0, 500.0),
                -- Medellín 2026: año en curso, sin recaudo reportado
                ('municipio', '05', '05001', 'municipio', 2026, '2026-06-01', 1, 'inversion',
                 70.0, 10.0, 12.0, null),
                -- San Andrés: un solo territorio, municipio 88001 y departamento 88
                ('municipio', '88', '88001', 'departamento-isla', 2025, '2025-12-01', 1, 'deuda',
                 5.0, 5.0, 5.0, 60.0),
                ('departamento', '88', null, 'departamento-isla', 2025, '2025-12-01', 1, 'deuda',
                 5.0, 5.0, 5.0, 60.0),
                ('departamento', '05', null, 'departamento', 2025, '2025-12-01', 1, 'inversion',
                 900.0, 800.0, 700.0, 2000.0)
            ) t(nivel, cod_dpto, cod_mpio, alcance, anio, periodo, vigencia, rubro,
                comprometido, obligado, pagado, recibido)
            """
        )
        conn.execute(
            """
            create table resumen_municipal as
            select * from (values
                ('05001', 2025, 12, 1500.0), ('05001', 2022, 3, null), ('81001', 2024, 0, null)
            ) t(cod_mpio, anio, contratos, valor_contratado)
            """
        )
        conn.execute(
            """
            create table resumen_departamento as
            select * from (values ('05', 2025, 40, 9000.0), ('81', 2024, 7, 70.0))
            t(cod_dpto, anio, contratos, valor_contratado)
            """
        )


def _con_san_andres(path: Path) -> None:
    with duckdb.connect(str(path)) as conn:
        conn.execute(
            "insert into mapa_municipios_corte values "
            "('88001', 'SAN ANDRÉS', 'municipio', '88', 'CO-SAP', 'ARCHIPIÉLAGO DE SAN ANDRÉS', "
            "2021, 2026, null, '2026-11')"
        )


def _paquete(path: Path) -> dict[str, dict[str, Any]]:
    with tarfile.open(path, "r:gz") as tar:
        return {
            m.name: json.loads(tar.extractfile(m).read())  # type: ignore[union-attr]
            for m in tar.getmembers()
        }


def test_export_writes_the_summaries_in_one_package(tmp_path: Path) -> None:
    database = tmp_path / "ekou.duckdb"
    _warehouse(database)
    _con_san_andres(database)
    out = tmp_path / "publicacion" / "2026-11"
    with duckdb.connect(str(database), read_only=True) as conn:
        export_mapa(conn, corte="2026-11", fecha_datos=date(2026, 11, 7), out_dir=out)
    archivos = _paquete(out / "resumen.tar.gz")

    # Arauca solo tiene un año con 0 contratos y sin valor: aun así hay archivo (es un dato).
    assert sorted(archivos) == [
        "resumen-departamento/05.json",
        "resumen-departamento/81.json",
        "resumen-departamento/88.json",
        "resumen/05001.json",
        "resumen/81001.json",
        "resumen/88001.json",
    ]
    medellin = archivos["resumen/05001.json"]
    assert (medellin["codigo"], medellin["nombre"], medellin["nivel"]) == (
        "05001",
        "Medellín",
        "municipio",
    )
    assert medellin["anios"] == [2021, 2022, 2023, 2024, 2025, 2026]
    assert sorted(medellin["porAnio"]) == ["2022", "2025", "2026"]

    gasto = medellin["porAnio"]["2025"]["gastoPublico"]
    assert gasto["periodo"] == "2025-12"
    assert gasto["completo"] is True
    assert gasto["alcance"] == "municipio"
    assert gasto["recibido"] == 500
    assert [r["clave"] for r in gasto["rubros"]] == ["funcionamiento", "deuda", "inversion"]
    assert gasto["rubros"][1]["etapas"] == {"comprometido": 0, "obligado": 0, "pagado": 0}
    assert gasto["total"] == {"comprometido": 400, "obligado": 340, "pagado": 330}
    assert gasto["reservas"]["total"] == {"comprometido": 40, "obligado": 30, "pagado": 30}
    assert gasto["cuentasPorPagar"] is None  # no reportó: null, no 0
    assert medellin["porAnio"]["2025"]["contratado"] == {"valor": 1500, "contratos": 12}

    # 2022 no tiene CUIPO pero sí contratos; sin valor confiable el valor es null.
    assert medellin["porAnio"]["2022"] == {
        "gastoPublico": None,
        "contratado": {"valor": None, "contratos": 3},
    }
    # Año en curso: cifras parciales y sin recaudo.
    en_curso = medellin["porAnio"]["2026"]["gastoPublico"]
    assert (en_curso["periodo"], en_curso["completo"], en_curso["recibido"]) == (
        "2026-06",
        False,
        None,
    )
    assert medellin["porAnio"]["2026"]["contratado"] is None


def test_summaries_flag_san_andres_as_one_territory_and_cite_their_sources(
    tmp_path: Path,
) -> None:
    database = tmp_path / "ekou.duckdb"
    _warehouse(database)
    _con_san_andres(database)
    out = tmp_path / "out"
    with duckdb.connect(str(database), read_only=True) as conn:
        export_mapa(conn, corte="2026-11", fecha_datos=date(2026, 11, 7), out_dir=out)
    archivos = _paquete(out / "resumen.tar.gz")

    isla = archivos["resumen/88001.json"]["porAnio"]["2025"]["gastoPublico"]
    assert isla["alcance"] == "departamento-isla"
    # El aviso de «un solo territorio» es del municipio; el departamento va como municipio.
    assert archivos["resumen-departamento/88.json"]["porAnio"]["2025"]["gastoPublico"][
        "alcance"
    ] == ("municipio")
    assert archivos["resumen-departamento/05.json"]["nombre"] == "Antioquia"
    assert archivos["resumen-departamento/05.json"]["porAnio"]["2025"]["contratado"] == {
        "valor": 9000,
        "contratos": 40,
    }

    fuentes = archivos["resumen/05001.json"]["fuentes"]
    assert [(f["usadoPara"], f["fechaCorte"]) for f in fuentes] == [
        ("gastoPublico", "2026-06-30"),  # fin del último trimestre del corte
        ("contratado", "2026-11-07"),
    ]
    assert fuentes[0]["id"] == "4f7r-epif"
    assert all(f["licencia"] == "CC BY-SA 4.0" for f in fuentes)


def test_package_is_reproducible(tmp_path: Path) -> None:
    database = tmp_path / "ekou.duckdb"
    _warehouse(database)
    with duckdb.connect(str(database), read_only=True) as conn:
        export_mapa(conn, corte="2026-11", fecha_datos=date(2026, 11, 7), out_dir=tmp_path / "a")
        export_mapa(conn, corte="2026-11", fecha_datos=date(2026, 11, 7), out_dir=tmp_path / "b")
    assert (tmp_path / "a" / "resumen.tar.gz").read_bytes() == (
        tmp_path / "b" / "resumen.tar.gz"
    ).read_bytes()


def test_export_writes_the_contract_shape(tmp_path: Path) -> None:
    database = tmp_path / "ekou.duckdb"
    _warehouse(database)
    out = tmp_path / "publicacion" / "2026-11"
    with duckdb.connect(str(database), read_only=True) as conn:
        paths = export_mapa(
            conn,
            corte="2026-11",
            fecha_datos=date(2026, 11, 7),
            out_dir=out,
            publicado_en=datetime(2026, 11, 8, 2, tzinfo=UTC),
        )

    assert [p.relative_to(out).as_posix() for p in paths] == [
        "municipios.json",
        "departamentos.json",
        "corte.json",
        "resumen.tar.gz",
    ]
    municipios = json.loads((out / "municipios.json").read_text("utf-8"))
    assert municipios["ventana"] == {"desde": 2021, "hasta": 2026}
    assert municipios["municipios"][0] == {
        "codigo": "05001",
        "nombre": "Medellín",
        "tipo": "municipio",
        "departamento": {"codigo": "05", "iso": "CO-ANT", "nombre": "Antioquia"},
        "contratosUbicados": 640861,
    }
    # Sin contratos ubicados: null, nunca 0.
    assert municipios["municipios"][1]["contratosUbicados"] is None

    departamentos = json.loads((out / "departamentos.json").read_text("utf-8"))
    assert departamentos["nacional"] == {
        "contratos": 667361,
        "contratosEnMunicipios": 640861,
        "contratosSoloDepartamento": 26200,
        "contratosSinLugar": 300,
    }
    assert departamentos["departamentos"] == [
        {
            "codigo": "05",
            "iso": "CO-ANT",
            "nombre": "Antioquia",
            "contratosEnMunicipios": 640861,
            "contratosSoloDepartamento": 25000,
        },
        {  # sin contratos ubicados en sus municipios: 0 medido, no "sin datos"
            "codigo": "81",
            "iso": "CO-ARA",
            "nombre": "Arauca",
            "contratosEnMunicipios": 0,
            "contratosSoloDepartamento": 1200,
        },
    ]

    corte = json.loads((out / "corte.json").read_text("utf-8"))
    assert corte["fechaCorte"] == "2026-11-07"
    assert corte["publicadoEn"] == "2026-11-08T02:00:00Z"
    assert corte["geometria"] == "mgn-2025"
    assert {f["id"] for f in corte["fuentes"]} >= {"jbjy-vk9h", "gdxc-w37w", "mgn-2025"}


def test_export_refuses_another_cut(tmp_path: Path) -> None:
    database = tmp_path / "ekou.duckdb"
    _warehouse(database, corte="2026-10")
    with (
        duckdb.connect(str(database), read_only=True) as conn,
        pytest.raises(ValueError, match="2026-10"),
    ):
        export_mapa(conn, corte="2026-11", fecha_datos=date(2026, 11, 7), out_dir=tmp_path / "out")
    assert not (tmp_path / "out").exists()


def test_cli_exports_to_the_publication_dir(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    _warehouse(tmp_path / "ekou.duckdb")
    _bronze(tmp_path, {"divipola": "2026-11-08T00:30:35+00:00"})
    monkeypatch.setenv("EKOU_DATA_DIR", str(tmp_path))
    assert main(["export-mapa", "--corte", "2026-11"]) == 0
    corte = json.loads((tmp_path / "publicacion/2026-11/corte.json").read_text("utf-8"))
    assert corte["fechaCorte"] == "2026-11-07"
    assert len(capsys.readouterr().out.splitlines()) == 4

"""Catálogo de fuentes: qué se extrae de cada dataset de datos.gov.co y cómo se particiona.

Ver ``docs/fuentes-de-datos.md`` para el detalle de cada fuente.
"""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class DatasetSpec:
    key: str
    """Nombre interno estable, usado en las rutas de la capa bronze."""

    socrata_id: str
    columns: tuple[str, ...]
    """Solo las columnas necesarias: reducen el volumen descargado."""

    year_partition_column: str | None = None
    """Columna de fecha para extraer en paralelo por año. ``None`` extrae en una sola partición."""

    description: str = ""


SECOP_CONTRATOS = DatasetSpec(
    key="secop_contratos",
    socrata_id="jbjy-vk9h",
    description="SECOP II – Contratos Electrónicos",
    year_partition_column="fecha_de_firma",
    columns=(
        "id_contrato",
        "proceso_de_compra",
        "nit_entidad",
        "nombre_entidad",
        "codigo_entidad",
        "departamento",
        "ciudad",
        "orden",
        "sector",
        "tipo_de_contrato",
        "modalidad_de_contratacion",
        "justificacion_modalidad_de",
        "estado_contrato",
        "objeto_del_contrato",
        "fecha_de_firma",
        "fecha_de_inicio_del_contrato",
        "fecha_de_fin_del_contrato",
        "tipodocproveedor",
        "documento_proveedor",
        "proveedor_adjudicado",
        "valor_del_contrato",
        "valor_pagado",
        "valor_facturado",
        "dias_adicionados",
        "urlproceso",
        "ultima_actualizacion",
    ),
)

DIVIPOLA = DatasetSpec(
    key="divipola",
    socrata_id="gdxc-w37w",
    description="DANE – Códigos de municipios (DIVIPOLA)",
    columns=("cod_dpto", "dpto", "cod_mpio", "nom_mpio", "tipo_municipio", "longitud", "latitud"),
)

CATALOG: dict[str, DatasetSpec] = {spec.key: spec for spec in (SECOP_CONTRATOS, DIVIPOLA)}

"""Catálogo de fuentes: qué se extrae de cada dataset de datos.gov.co y cómo se particiona.

Ver ``docs/fuentes-de-datos.md`` para el detalle de cada fuente y
``docs/investigacion-ingesta.md`` para la evidencia detrás de cada decisión.

Minimización de datos personales (Ley 1581 de 2012): no se extraen cuentas bancarias,
domicilios, representantes legales, supervisores ni ordenadores del gasto. Los documentos de
contratistas sí se extraen porque son la llave de cruce, y se seudonimizan en silver.
"""

import hashlib
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class DatasetSpec:
    key: str
    """Nombre interno estable, usado en las rutas de la capa bronze."""

    socrata_id: str
    columns: tuple[str, ...]
    """Solo las columnas necesarias: reducen el volumen descargado y los datos personales."""

    year_partition_column: str | None = None
    """Columna de fecha para extraer en paralelo por año."""

    min_year: int | None = None
    """Años anteriores (o posteriores al año siguiente al corte) van a una partición
    ``fuera_de_rango``: evita decenas de particiones diminutas con fechas mal digitadas."""

    explicit_partitions: tuple[tuple[str, str], ...] = ()
    """Particiones ``(nombre, condición SoQL)`` para datasets sin columna de fecha.
    Deben cubrir todo el dataset: se verifica contra ``count(*)`` antes de extraer."""

    description: str = ""

    @property
    def schema_fingerprint(self) -> str:
        """Huella de las columnas: si cambian, las particiones ya extraídas dejan de valer."""
        return hashlib.sha256(",".join(self.columns).encode()).hexdigest()[:16]


def _prefix_partitions(column: str, prefix: str) -> tuple[tuple[str, str], ...]:
    """Particiones por primer dígito tras un prefijo (por ejemplo ``CO1.PCCNTR.7…``)."""
    return tuple((f"d{d}", f"starts_with({column}, '{prefix}{d}')") for d in range(1, 10))


SECOP_CONTRATOS = DatasetSpec(
    key="secop_contratos",
    socrata_id="jbjy-vk9h",
    description="SECOP II – Contratos Electrónicos",
    year_partition_column="fecha_de_firma",
    columns=(
        "id_contrato",
        "proceso_de_compra",
        "referencia_del_contrato",
        "nit_entidad",
        "nombre_entidad",
        "codigo_entidad",
        "departamento",
        "ciudad",
        "localizaci_n",
        "orden",
        "sector",
        "tipo_de_contrato",
        "codigo_de_categoria_principal",
        "modalidad_de_contratacion",
        "justificacion_modalidad_de",
        "estado_contrato",
        "objeto_del_contrato",
        "fecha_de_firma",
        "fecha_de_inicio_del_contrato",
        "fecha_de_fin_del_contrato",
        "duraci_n_del_contrato",
        "tipodocproveedor",
        "documento_proveedor",
        "proveedor_adjudicado",
        "valor_del_contrato",
        "valor_pagado",
        "valor_facturado",
        "dias_adicionados",
        "liquidaci_n",
        "origen_de_los_recursos",
        "urlproceso",
        "ultima_actualizacion",
    ),
)

SECOP_PROCESOS = DatasetSpec(
    key="secop_procesos",
    socrata_id="p6dx-8zbt",
    description="SECOP II – Procesos de Contratación (valor inicial, competencia, duración)",
    year_partition_column="fecha_de_publicacion_del",
    columns=(
        "id_del_proceso",
        "id_del_portafolio",
        "referencia_del_proceso",
        "entidad",
        "nit_entidad",
        "codigo_entidad",
        "nombre_del_procedimiento",
        "fase",
        "fecha_de_publicacion_del",
        "precio_base",
        "modalidad_de_contratacion",
        "justificaci_n_modalidad_de",
        "duracion",
        "unidad_de_duracion",
        "proveedores_invitados",
        "proveedores_que_manifestaron",
        "respuestas_al_procedimiento",
        "proveedores_unicos_con",
        "numero_de_lotes",
        "estado_del_procedimiento",
        "estado_resumen",
        "adjudicado",
        "id_adjudicacion",
        "fecha_adjudicacion",
        "valor_total_adjudicacion",
        "nit_del_proveedor_adjudicado",
        "codigo_principal_de_categoria",
        "tipo_de_contrato",
        "urlproceso",
    ),
)

SECOP_UBICACIONES = DatasetSpec(
    key="secop_ubicaciones",
    socrata_id="gra4-pcp2",
    description="SECOP II – Ubicaciones de ejecución de los contratos",
    explicit_partitions=_prefix_partitions("id_contrato", "CO1.PCCNTR."),
    columns=(
        "id_contrato",
        "proceso_de_compra",
        "codigo_entidad",
        "nit_entidad",
        "localizaci_n",
        "ubicacion",
    ),
)

SECOP_I = DatasetSpec(
    key="secop_i",
    socrata_id="f789-7hwg",
    description="SECOP I – Procesos de Compra Pública (contratación que no pasa por SECOP II)",
    year_partition_column="fecha_de_firma_del_contrato",
    min_year=2014,
    columns=(
        "uid",
        "numero_de_proceso",
        "numero_de_contrato",
        "nivel_entidad",
        "orden_entidad",
        "nombre_entidad",
        "nit_de_la_entidad",
        "c_digo_de_la_entidad",
        "municipio_entidad",
        "departamento_entidad",
        "municipios_ejecucion",
        "modalidad_de_contratacion",
        "causal_de_otras_formas_de",
        "nombre_regimen_de_contratacion",
        "estado_del_proceso",
        "tipo_de_contrato",
        "id_clase",
        "detalle_del_objeto_a_contratar",
        "tipo_identifi_del_contratista",
        "identificacion_del_contratista",
        "nom_razon_social_contratista",
        "fecha_de_cargue_en_el_secop",
        "fecha_de_firma_del_contrato",
        "fecha_ini_ejec_contrato",
        "plazo_de_ejec_del_contrato",
        "rango_de_ejec_del_contrato",
        "tiempo_adiciones_en_dias",
        "fecha_fin_ejec_contrato",
        "cuantia_proceso",
        "cuantia_contrato",
        "valor_total_de_adiciones",
        "valor_contrato_con_adiciones",
        "codigo_bpin",
        "ruta_proceso_en_secop_i",
        "ultima_actualizacion",
    ),
)

DIVIPOLA = DatasetSpec(
    key="divipola",
    socrata_id="gdxc-w37w",
    description="DANE – Códigos de municipios (DIVIPOLA)",
    columns=("cod_dpto", "dpto", "cod_mpio", "nom_mpio", "tipo_municipio", "longitud", "latitud"),
)

CATALOG: dict[str, DatasetSpec] = {
    spec.key: spec
    for spec in (SECOP_CONTRATOS, SECOP_PROCESOS, SECOP_UBICACIONES, SECOP_I, DIVIPOLA)
}

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  BottomSheet,
  type Detent,
  type SheetFrame,
} from '../../../../components/ui/BottomSheet/BottomSheet';
import { Button } from '../../../../components/ui/Button/Button';
import { formatNumber } from '../../../../components/ui/format';
import { KeyFigure } from '../../../../components/ui/KeyFigure/KeyFigure';
import { LegendKey } from '../../../../components/ui/LegendKey/LegendKey';
import { ARCHIPELAGO, departmentRoute, fullscreenView, type MapRoute, mapView } from '../mapModel';
import { fictionalLevel, sampleMap } from '../sample';
import { MapLegend, MapWithLegend, type MapWithLegendProps } from './MapWithLegend';

const NEUTRAL_NOTE = 'Todavía no hay color por riesgo. Gris no quiere decir «sin problemas».';
const FICTIONAL_NOTE =
  'Vista previa de la fase 2: los niveles de riesgo son inventados para mostrar el diseño. Las cifras de contratos sí son reales. El dato de riesgo llegará con la metodología (TASK-07).';
const ARCHIPELAGO_NOTE =
  'San Andrés y Providencia están a unos 90 km. En el mapa se acercan para verlas juntas a la misma escala, sin cambiar su forma.';

function legendFor(risk: boolean, withUnknown: boolean, extra: string[] = []) {
  return risk ? (
    <MapLegend
      title="Contratos con señales · datos ficticios"
      items={[
        { fill: 'low', label: 'Bajo' },
        { fill: 'medium', label: 'Intermedio' },
        { fill: 'high', label: 'Alto' },
        ...(withUnknown ? [{ fill: 'unknown' as const, label: 'Sin datos' }] : []),
      ]}
      notes={[FICTIONAL_NOTE, ...extra]}
    />
  ) : (
    <MapLegend
      title="Qué muestra el mapa"
      items={[
        { fill: 'neutral', label: 'Territorio con contratos ubicados' },
        ...(withUnknown
          ? [
              {
                fill: 'unknown' as const,
                label: 'Sin datos: no hay contratos ubicados con certeza',
              },
            ]
          : []),
      ]}
      notes={[NEUTRAL_NOTE, ...extra]}
    />
  );
}

/** A map view built like the page builds it, from the real sample. */
function View({ route, risk }: { route: MapRoute; risk: boolean }) {
  const [current, setCurrent] = useState(route);
  const view = mapView(sampleMap, current, risk ? fictionalLevel : undefined);
  const onSelect = (code: string) =>
    setCurrent(current.view === 'country' ? departmentRoute(code) : { view: 'municipality', code });
  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
      <MapWithLegend {...view} onSelect={onSelect} />
      {legendFor(risk, view.withUnknown, view.archipelago ? [ARCHIPELAGO_NOTE] : [])}
    </div>
  );
}

const meta = {
  title: 'Componentes/Mapa/MapWithLegend',
  component: MapWithLegend,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Mapa de territorios con su leyenda (`MapLegend`). **Para qué sirve:** ubicar un lugar y elegirlo; en la fase 2, ver dónde se concentran las señales. Nació en la página del Mapa (TASK-09, guía v1.3.0).',
          '',
          '**Dos formas de ponerlo.** *En la página* (por defecto, `variant` sin indicar): el mapa en un marco, con su tabla al lado; la usa la pantalla del Mapa de la especificación del 2026-11-15. *A pantalla completa* (`variant="fullscreen"`, especificación del 2026-11-17, boceto A): el mapa ocupa toda la pantalla bajo la ficha (`BottomSheet`) y se describe más abajo.',
          '',
          '**Variantes de relleno.** *Neutra:* un solo relleno (`--el-color-line`) que ubica sin medir nada; es la de hoy, porque el corte todavía no trae riesgo. *Riesgo:* rellenos bajo / intermedio / alto de la guía; aquí solo con niveles **ficticios** hasta TASK-07. *Sin datos:* trama gris, nunca 0 ni riesgo bajo.',
          '',
          '**Cómo se usa.** Zoom con + y − (44 px, con nombre accesible); «Ver todo» aparece solo cuando el mapa está acercado o movido, y al usarlo el foco pasa a «Acercar», Ctrl + rueda o pellizco. Con mouse se arrastra a cualquier zoom; un clic sin mover elige. Con un dedo, a vista completa, la página sigue desplazándose. El territorio bajo el puntero se dibuja encima para que su borde no quede cortado; el elegido lleva contorno de 2,5 px en el color del texto.',
          '',
          '**Accesibilidad.** Es un `<svg role="img">` con un título que dice dónde están los valores: **siempre** va con una tabla de datos, que es la ruta de teclado a cada territorio. Nada depende del hover ni del color solo.',
          '',
          '**Evita:** pintar el riesgo sin metodología, usar opacidad para el hover, nombres de departamento sobre el mapa (solo el elegido, el recuadro y Bogotá). Muestra real del corte 2026-11.',
          '',
          '### A pantalla completa',
          '',
          '**Para qué sirve:** la página del mapa en una sola pantalla: un solo mapa con tres niveles (Colombia, departamento y municipio) y la ficha encima. Las props salen de `fullscreenView(mapa, ruta)` (`mapModel.ts`); `sheet` recibe lo que avisa `onLayoutChange` de la `BottomSheet`, para que cada lugar se encuadre en la **zona libre**: sobre la ficha, bajo el buscador y las migas, a la izquierda del zoom y, si está, a la derecha del recuadro de esquina. En escritorio (panel de 400 px), a la izquierda del panel. Si la persona no ha movido el mapa, se vuelve a encuadrar cuando la ficha cambia de altura.',
          '',
          '**Cámara y vuelos.** Cambiar de lugar es un vuelo de cámara sobre el mismo mapa: `--el-duration-long` entre Colombia y un departamento o entre departamentos; `--el-duration-base` dentro de un departamento y con «Ver todo»; `--el-duration-short` al cambiar la ficha de altura y con + / −. Todos con `--el-ease-standard`; el zoom se interpola de forma geométrica. Con `prefers-reduced-motion`, el mapa salta a su encuadre sin vuelo y los municipios aparecen sin fundido.',
          '',
          '**Gestos.** Un dedo o el ratón siempre arrastran (cursor de mano), a cualquier zoom; dos dedos, la rueda (sin Ctrl) o + / − acercan y alejan alrededor del punto, de 0,7 a 80 veces el encuadre del país. El país nunca sale de la zona libre. Un toque sin moverse elige; un arrastre de más de 6 px nunca elige. Alejar desde un departamento hasta cerca del encuadre del país avisa `onZoomToCountry`. La página nunca se desplaza.',
          '',
          '**Qué se ve.** En un departamento, sus municipios aparecen con un fundido y los demás departamentos quedan atenuados y se pueden tocar. Un municipio llena como máximo cerca del 55 % de la zona libre, con su rótulo y contorno de 2,5 px en el color del texto; sus vecinos quedan atenuados y se pueden tocar. El lugar al que te vas a pasar se delinea con `--el-color-control-border` a 1,5 px con el puntero encima o el dedo apoyado. **San Andrés y Providencia:** en Colombia, un recuadro punteado dentro del mapa, al noroeste, con las islas ampliadas a una sola escala; en el archipiélago, las islas se quedan en ese recuadro, con su nombre debajo; en cualquier otro lugar, un recuadro fijo de 68 px en la esquina que lleva al archipiélago. Con la ficha completa se ocultan el zoom, el recuadro de esquina y los rótulos; `controlsHidden` (v1.6.0) oculta el zoom y el recuadro de esquina mientras algo los cubre, como la lista del buscador abierta.',
          '',
          '**Accesibilidad.** El mapa es `role="img"` y su nombre remite a la tabla de la ficha, que es la ruta de teclado a cada lugar; cada forma lleva su nombre en `<title>`. El zoom y el recuadro de esquina son botones de 44 px o más con nombre. Nada depende del paso del puntero. El zoom y el recuadro de esquina se ocultan cuando la ficha llega a su franja (pantalla baja, texto al 200 %).',
          '',
          '**Historias.** Las de pantalla completa se ven cada una en su propia página (no en esta Docs, para que la rueda no quede atrapada en el mapa): un marco de celular de 390 × 760 px, uno de escritorio de hasta 1280 px y una pantalla baja de 320 × 580 px, con la ficha a media altura. El buscador, las migas y los estados de **carga** y **error** son de la pantalla del Mapa (paso 4 de la página), no de este componente.',
        ].join('\n'),
      },
    },
  },
  args: { title: '', territories: [], box: [0, 0, 1, 1] },
} satisfies Meta<typeof MapWithLegend>;

export default meta;
type Story = StoryObj<MapWithLegendProps>;

export const CountryNeutral: Story = {
  name: 'Nacional · neutro',
  render: () => <View route={{ view: 'country' }} risk={false} />,
};
export const CountryFictionalRisk: Story = {
  name: 'Nacional · riesgo ficticio',
  render: () => <View route={{ view: 'country' }} risk />,
};
export const DepartmentNoData: Story = {
  name: 'Departamento con «Sin datos» (Guainía)',
  render: () => <View route={{ view: 'department', code: '94' }} risk={false} />,
};
export const MunicipalitySelected: Story = {
  name: 'Municipio elegido (Medellín)',
  render: () => <View route={{ view: 'municipality', code: '05001' }} risk={false} />,
};
export const BogotaInItsGap: Story = {
  name: 'Cundinamarca con Bogotá en su hueco',
  render: () => <View route={{ view: 'department', code: '25' }} risk={false} />,
};
export const Archipelago: Story = {
  name: 'Archipiélago en un panel a la misma escala',
  render: () => <View route={{ view: 'department', code: '88' }} risk={false} />,
};
export const MunicipalitiesFictionalRisk: Story = {
  name: 'Municipios · riesgo ficticio (Antioquia)',
  render: () => <View route={{ view: 'municipality', code: '05001' }} risk />,
};
export const Narrow: Story = {
  name: 'Celular de 320 px',
  render: () => (
    <div style={{ width: 288 }}>
      <View route={{ view: 'municipality', code: '05001' }} risk={false} />
    </div>
  ),
};

// ---------- Full-screen variant (map spec of 2026-11-17) ----------

const WINDOW = 'del 1 ene 2021 al 7 nov 2026';
const SOURCE = 'Fuentes: SECOP II y SECOP I, DANE. Datos al 7 nov 2026.';
const PLACE_SOURCE = `${SOURCE} Este mapa todavía no mide riesgo.`;
const ISLANDS_NOTE =
  'En el mapa se acorta la distancia entre San Andrés y Providencia (unos 90 km) para verlas juntas, a la misma escala y sin cambiar su forma.';
const small = { fontSize: 'var(--el-size-small)', marginTop: 'var(--el-space-8)' } as const;
const muted = { ...small, color: 'var(--el-color-text-muted)' } as const;

/** The sheet's text for a place, from the real sample (spec §2 and §6). */
function sheetFor(route: MapRoute) {
  const departments = sampleMap.data.departments;
  if (route.view === 'municipality') {
    const m = sampleMap.municipalities.get(route.code);
    if (!m) throw new Error(`${route.code} is not in the sample`);
    const kind =
      m.tipo === 'isla'
        ? ' · Isla'
        : m.tipo === 'area_no_municipalizada'
          ? ' · Área no municipalizada'
          : '';
    return {
      kicker: `${m.departamento.nombre} · DANE ${m.codigo}${kind}`,
      name: m.nombre,
      more: `Ver ${m.departamento.nombre} y tabla`,
      header: (
        <KeyFigure
          value={m.contratosUbicados}
          context={
            m.contratosUbicados === null
              ? `No encontramos contratos ubicados con certeza en este lugar ${WINDOW}.`
              : `contratos firmados ${WINDOW} y ubicados en ${m.nombre}`
          }
          source={PLACE_SOURCE}
        />
      ),
    };
  }
  if (route.view === 'department') {
    const d = sampleMap.departments.get(route.code);
    if (!d) throw new Error(`${route.code} is not in the sample`);
    const withUnknown = (sampleMap.byDepartment.get(d.codigo) ?? []).some(
      (m) => m.contratosUbicados === null,
    );
    return {
      kicker: `DANE ${d.codigo}`,
      name: d.nombre,
      more: 'Ver tabla y fuentes',
      header: (
        <>
          <p>
            <strong>{formatNumber(d.contratosEnMunicipios, 0)}</strong> contratos en sus municipios
            y <strong>{formatNumber(d.contratosSoloDepartamento, 0)}</strong> sin municipio
            identificado, {WINDOW}. Elige un municipio.
          </p>
          {d.codigo === ARCHIPELAGO ? <p style={muted}>{ISLANDS_NOTE}</p> : null}
          {withUnknown ? (
            <p
              style={{ ...small, display: 'flex', gap: 'var(--el-space-8)', alignItems: 'center' }}
            >
              <LegendKey kind="unknown" />
              Sin datos: no hay contratos ubicados con certeza
            </p>
          ) : null}
          <p style={muted}>{PLACE_SOURCE}</p>
        </>
      ),
    };
  }
  return {
    kicker: 'Mapa de contratación pública',
    name: `${formatNumber(departments.nacional.contratos, 0)} contratos públicos firmados en Colombia`,
    more: 'Ver cifras, tabla y fuentes',
    header: (
      <>
        <p style={{ color: 'var(--el-color-text-muted)' }}>
          Del 1 ene 2021 al 7 nov 2026. Elige un departamento. Este mapa todavía no mide riesgo.
        </p>
        <p style={muted}>{SOURCE}</p>
      </>
    ),
  };
}

/** Story harness: the full-screen map and the sheet over it, each place reached by tapping the map. */
function Screen({
  initial,
  desktop = false,
  height = 760,
  controlsHidden = false,
}: {
  initial: MapRoute;
  desktop?: boolean;
  /** The zoom and the corner inset hidden, as under the open search list. */
  controlsHidden?: boolean;
  /** Frame height in px (the short-screen case). */
  height?: number;
}) {
  const [route, setRoute] = useState(initial);
  const [detent, setDetent] = useState<Detent>('half');
  const [sheet, setSheet] = useState<SheetFrame>();
  const view = fullscreenView(sampleMap, route);
  const text = sheetFor(route);
  const go = (next: MapRoute) => {
    setRoute(next);
    setDetent('half');
  };
  const handleSelect = (code: string) => {
    // With the full sheet, a tap on the map lowers it instead of choosing (spec §3).
    if (sheet?.shown === 'full' && !sheet.isPanel) return setDetent('half');
    go(code.length === 2 ? departmentRoute(code) : { view: 'municipality', code });
  };
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: desktop ? 1280 : 390,
        height,
        overflow: 'hidden',
      }}
    >
      <MapWithLegend
        variant="fullscreen"
        {...view}
        sheet={sheet}
        controlsHidden={controlsHidden}
        onSelect={handleSelect}
        onZoomToCountry={() => go({ view: 'country' })}
      />
      {/* Phone: the full sheet leaves 68 px of map below the search field (12 + 44 + 68). The box lets
          taps through to the map; only the sheet takes them. */}
      <div
        style={{
          position: 'absolute',
          inset: sheet?.isPanel ? 0 : '124px 0 0',
          pointerEvents: 'none',
        }}
      >
        <BottomSheet
          label="Ficha del lugar"
          detent={detent}
          onDetentChange={setDetent}
          onLayoutChange={setSheet}
          title={
            <>
              <p style={{ fontSize: 'var(--el-size-small)', color: 'var(--el-color-text-muted)' }}>
                {text.kicker}
              </p>
              <h1
                style={{
                  fontSize: 'var(--el-size-title-mobile)',
                  lineHeight: 'var(--el-line-heading)',
                }}
              >
                {text.name}
              </h1>
            </>
          }
          header={({ shown, isPanel }) => (
            <>
              {text.header}
              {isPanel ? null : (
                <div style={{ marginTop: 'var(--el-space-12)' }}>
                  <Button
                    variant="secondary"
                    label={shown === 'full' ? 'Volver al mapa' : text.more}
                    aria-expanded={shown === 'full'}
                    onClick={() => setDetent(shown === 'full' ? 'half' : 'full')}
                  />
                </div>
              )}
            </>
          )}
        >
          <h2
            style={{
              fontSize: 'var(--el-size-subsection)',
              margin: 'var(--el-space-16) 0 var(--el-space-8)',
            }}
          >
            Fuentes
          </h2>
          <p style={{ fontSize: 'var(--el-size-small)' }}>{SOURCE}</p>
          <p style={muted}>{NEUTRAL_NOTE}</p>
        </BottomSheet>
      </div>
    </div>
  );
}

const fullscreen = { layout: 'fullscreen' } as const;
// Each full-screen story on its own page: in the Docs page the map would catch the wheel.
const tags = ['!autodocs'];

export const FullscreenCountry: Story = {
  name: 'Pantalla completa · Colombia',
  render: () => <Screen initial={{ view: 'country' }} />,
  parameters: fullscreen,
  tags,
};
export const FullscreenDepartment: Story = {
  name: 'Pantalla completa · Departamento (Antioquia)',
  render: () => <Screen initial={{ view: 'department', code: '05' }} />,
  parameters: fullscreen,
  tags,
};
export const FullscreenMunicipality: Story = {
  name: 'Pantalla completa · Municipio con vecinos atenuados (Medellín)',
  render: () => <Screen initial={{ view: 'municipality', code: '05001' }} />,
  parameters: fullscreen,
  tags,
};
export const FullscreenArchipelago: Story = {
  name: 'Pantalla completa · Archipiélago',
  render: () => <Screen initial={{ view: 'department', code: '88' }} />,
  parameters: fullscreen,
  tags,
};
export const FullscreenCornerInset: Story = {
  name: 'Pantalla completa · Recuadro de esquina (Cundinamarca, con Bogotá)',
  render: () => <Screen initial={{ view: 'department', code: '25' }} />,
  parameters: fullscreen,
  tags,
};
export const FullscreenNoData: Story = {
  name: 'Pantalla completa · «Sin datos» (Guainía)',
  render: () => <Screen initial={{ view: 'department', code: '94' }} />,
  parameters: fullscreen,
  tags,
};
export const FullscreenDesktopCountry: Story = {
  name: 'Pantalla completa · Escritorio · Colombia',
  render: () => <Screen initial={{ view: 'country' }} desktop />,
  parameters: fullscreen,
  tags,
};
export const FullscreenDesktopMunicipality: Story = {
  name: 'Pantalla completa · Escritorio · Medellín',
  render: () => <Screen initial={{ view: 'municipality', code: '05001' }} desktop />,
  parameters: fullscreen,
  tags,
};
export const FullscreenDesktopArchipelago: Story = {
  name: 'Pantalla completa · Escritorio · Archipiélago',
  render: () => <Screen initial={{ view: 'department', code: '88' }} desktop />,
  parameters: fullscreen,
  tags,
};
export const FullscreenSmallMunicipality: Story = {
  name: 'Pantalla completa · Municipio pequeño (Sabaneta)',
  render: () => <Screen initial={{ view: 'municipality', code: '05631' }} />,
  parameters: fullscreen,
  tags,
};
export const FullscreenShortScreen: Story = {
  name: 'Pantalla completa · Pantalla baja (320 × 580, ficha en su altura máxima)',
  render: () => <Screen initial={{ view: 'municipality', code: '05001' }} height={580} />,
  parameters: fullscreen,
  tags,
};
export const FullscreenControlsHidden: Story = {
  name: 'Pantalla completa · Zoom oculto (lista del buscador abierta)',
  render: () => <Screen initial={{ view: 'department', code: '05' }} controlsHidden />,
  parameters: fullscreen,
  tags,
};

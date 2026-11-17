import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';
import { componentDocs } from '../../../../.storybook/catalog/shared';
import { Button } from '../Button/Button';
import { Counter } from '../Counter/Counter';
import { DataTable } from '../DataTable/DataTable';
import { formatNumber } from '../format';
import { KeyFigure } from '../KeyFigure/KeyFigure';
import { LegendKey } from '../LegendKey/LegendKey';
import { BottomSheet, type Detent } from './BottomSheet';

type Municipality = { code: string; name: string; contracts: number | null };
type Place = {
  code: string;
  name: string;
  /** One-line label (spec decision 28): department · DANE code (· kind). */
  kicker: string;
  contracts: number | null;
  department: string;
  inMunicipalities: number;
  withoutMunicipality: number;
  tableNote?: string;
  municipalities: Municipality[];
};

const WINDOW = 'del 1 ene 2021 al 7 nov 2026';
const SOURCE =
  'Fuentes: SECOP II y SECOP I, DANE. Datos al 7 nov 2026. Este mapa todavía no mide riesgo.';

// Real map sample (cut 2026-11, data to 7 Nov 2026), municipalities in alphabetical order (spec decision 2).
const MEDELLIN: Place = {
  code: '05001',
  name: 'Medellín',
  kicker: 'Antioquia · DANE 05001',
  contracts: 356935,
  department: 'Antioquia',
  inMunicipalities: 819086,
  withoutMunicipality: 8565,
  tableNote: ' · muestra: 6 de 125',
  municipalities: [
    { code: '05088', name: 'Bello', contracts: 27457 },
    { code: '05129', name: 'Caldas', contracts: 10244 },
    { code: '05266', name: 'Envigado', contracts: 21623 },
    { code: '05360', name: 'Itagüí', contracts: 17301 },
    { code: '05001', name: 'Medellín', contracts: 356935 },
    { code: '05631', name: 'Sabaneta', contracts: 20518 },
  ],
};

const SAN_ANDRES: Place = {
  code: '88001',
  name: 'San Andrés',
  kicker: 'Archipiélago de San Andrés, Providencia y Santa Catalina · DANE 88001 · Isla',
  contracts: 9128,
  department: 'Archipiélago de San Andrés, Providencia y Santa Catalina',
  inMunicipalities: 28086,
  withoutMunicipality: 28623,
  municipalities: [
    { code: '88564', name: 'Providencia', contracts: 18958 },
    { code: '88001', name: 'San Andrés', contracts: 9128 },
  ],
};

const PUERTO_COLOMBIA: Place = {
  code: '94884',
  name: 'Puerto Colombia',
  kicker: 'Guainía · DANE 94884 · Área no municipalizada',
  contracts: null,
  department: 'Guainía',
  inMunicipalities: 19211,
  withoutMunicipality: 220,
  municipalities: [
    { code: '94343', name: 'Barrancominas', contracts: 1577 },
    { code: '94886', name: 'Cacahual', contracts: null },
    { code: '94001', name: 'Inírida', contracts: 17632 },
    { code: '94885', name: 'La Guadalupe', contracts: null },
    { code: '94888', name: 'Morichal', contracts: null },
    { code: '94887', name: 'Pana Pana', contracts: null },
    { code: '94884', name: 'Puerto Colombia', contracts: null },
    { code: '94883', name: 'San Felipe', contracts: 2 },
  ],
};

const NO_DATA = (
  <>
    <LegendKey kind="unknown" />
    Sin datos
  </>
);

/** The map page's sheet content for one place, with the height kept in the story's own state. */
function PlaceSheet({ place, initialDetent }: { place: Place; initialDetent: Detent }) {
  const [detent, setDetent] = useState<Detent>(initialDetent);
  return (
    <BottomSheet
      label="Ficha del lugar"
      detent={detent}
      onDetentChange={setDetent}
      title={
        <>
          <p style={{ fontSize: 'var(--el-size-small)', color: 'var(--el-color-text-muted)' }}>
            {place.kicker}
          </p>
          <h1 style={{ fontSize: 'var(--el-size-title-mobile)' }}>{place.name}</h1>
        </>
      }
      header={({ shown, isPanel }) => (
        <>
          <KeyFigure
            value={place.contracts}
            context={
              place.contracts === null
                ? `No encontramos contratos ubicados con certeza en este lugar ${WINDOW}.`
                : `contratos firmados ${WINDOW} y ubicados en ${place.name}`
            }
            source={SOURCE}
          />
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--el-space-8)',
              marginTop: 'var(--el-space-12)',
            }}
          >
            <Button variant="secondary" label="Copiar enlace" />
            {/* In the panel the table is already in view (spec §6): no height button. */}
            {isPanel ? null : (
              <Button
                variant="secondary"
                label={shown === 'full' ? 'Volver al mapa' : `Ver ${place.department} y tabla`}
                aria-expanded={shown === 'full'}
                // Half shown as full (no room for the header) goes back to the map through peek.
                onClick={() =>
                  setDetent(shown !== 'full' ? 'full' : detent === 'half' ? 'peek' : 'half')
                }
              />
            )}
          </div>
        </>
      )}
    >
      <h2 style={{ fontSize: 'var(--el-size-subsection)', margin: 'var(--el-space-16) 0' }}>
        {place.department}
      </h2>
      <Counter
        layout="adaptive"
        counts={[
          { value: place.inMunicipalities, label: `en los municipios de ${place.department}` },
          {
            value: place.withoutMunicipality,
            label: 'sin municipio identificado',
            note: 'sabemos el departamento, no el municipio',
          },
        ]}
      />
      <DataTable
        caption={`Contratos ubicados por municipio de ${place.department}${place.tableNote ?? ''}`}
        columns={[{ label: 'Municipio' }, { label: 'Contratos', numeric: true }]}
        rows={place.municipalities.map((m) => ({
          id: m.code,
          header: m.name,
          cells: [m.contracts === null ? NO_DATA : formatNumber(m.contracts, 0)],
        }))}
        currentRowId={place.code}
      />
      <h2
        style={{
          fontSize: 'var(--el-size-subsection)',
          margin: 'var(--el-space-24) 0 var(--el-space-8)',
        }}
      >
        Fuentes
      </h2>
      <p style={{ fontSize: 'var(--el-size-small)' }}>{SOURCE}</p>
      <p
        style={{
          fontSize: 'var(--el-size-small)',
          color: 'var(--el-color-text-muted)',
          marginTop: 'var(--el-space-8)',
        }}
      >
        Todavía no hay color por riesgo. Gris no quiere decir “sin problemas”.
      </p>
    </BottomSheet>
  );
}

type FrameProps = {
  place?: Place;
  initialDetent?: Detent;
  /** Frame height in px (the short-screen case). */
  height?: number;
  /** Simulates 200 % text: the browser zoom halves the CSS viewport (195 × 380 px shown at 390 × 760). */
  doubleText?: boolean;
  /** Desktop: as wide as the page allows, up to 1280 px; the sheet covers the whole height. */
  desktop?: boolean;
  /** Another sheet instead of the place one (the loading state). */
  children?: ReactNode;
};

// Story frame only: the grey box stands in for the map, as wide as the phone (up to 390 px). On a phone
// the sheet area starts 124 px down: search field 12 + 44 px, plus 68 px of map visible at full height.
function Frame({
  place = MEDELLIN,
  initialDetent = 'half',
  height = 760,
  doubleText = false,
  desktop = false,
  children,
}: FrameProps) {
  const area = (
    <div style={{ position: 'absolute', inset: desktop ? 0 : '124px 0 0' }}>
      {children ?? <PlaceSheet place={place} initialDetent={initialDetent} />}
    </div>
  );
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: desktop ? 1280 : 390,
        height,
        overflow: 'hidden',
        background: 'var(--el-color-surface-subtle)',
      }}
    >
      {doubleText ? (
        // A zoomed box keeps its percentage size on screen; only its content (and CSS px) doubles.
        <div style={{ position: 'relative', width: '100%', height: '100%', zoom: 2 }}>{area}</div>
      ) : (
        area
      )}
    </div>
  );
}

const meta = {
  title: 'Componentes/UI/BottomSheet',
  component: BottomSheet,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    ...componentDocs(
      'BottomSheet',
      [
        'Ficha deslizable sobre un mapa a pantalla completa: el encabezado del lugar siempre a mano y un cuerpo (cifras, tabla y fuentes) que se abre sin salir de la pantalla. Tres alturas: **recogida** (rótulo y `h1`), **media** (todo el encabezado; es la de llegada) y **completa** (el cuerpo con su propio desplazamiento). Desde 1024 px de ancho de su contenedor es un **panel fijo de 400 px a la derecha**, sin alturas ni borde.',
        '**Cuándo usarla:** cuando un mapa o un lienzo ocupa toda la pantalla y la información del lugar elegido debe convivir con él. **Cuándo no:** para un aviso o una confirmación (usa `Alert`), para un formulario o una tarea que tapa la página (un diálogo), ni en una página que ya se desplaza: la ficha supone que la página no se mueve.',
        '**Props:** `label` (nombre accesible), `title` (lo que se ve recogida), `header` (el resto del encabezado, una función que recibe `{ shown, isPanel }`: la altura que se ve y si es el panel, para decir «Volver al mapa» con la ficha completa y quitar ese botón en el panel), `children` (el cuerpo), `detent` y `onDetentChange` (altura pedida, controlada) y, opcional, `onLayoutChange` (avisa `{ shown, isPanel, height }` cuando la ficha queda en otra altura o cambia de medida, para que el mapa de debajo se encuadre en lo que queda libre; v1.5.0). La ficha llena su contenedor posicionado y la completa ocupa todo ese contenedor: los 68 px de mapa que deben quedar a la vista los deja quien la posiciona (en el mapa, `inset: 124px 0 0`: buscador 12 + 44 px y 68 px de mapa).',
        '**Teclado y gestos:** el borde es un `button` de 44 px cuyo nombre dice la altura («Ficha a media altura. Cambiar altura»). Toque, Enter o Espacio mueven un paso, siempre volviendo a la media: media → completa → media → recogida → media (decisión 27 de la [especificación del mapa](https://github.com/EKOU-Solutions/EKOU-Elephants/blob/main/docs/design/pages/map/spec.md)). **Escape** con la ficha completa la baja a la media y deja el foco en el borde. Solo el borde y el encabezado arrastran; al soltar se ajusta a la altura más cercana y un movimiento rápido la empuja una más. Con la ficha completa, arrastrar el encabezado hacia arriba desplaza el cuerpo. Cada cambio se anuncia en `role="status"`; lo que queda oculto es `inert` y, si tenía el foco, el foco pasa al borde. Si el encabezado no cabe en la media (pantalla baja, texto al 200 %), la ficha se ve completa y todo se calcula sobre lo que se ve: el borde dice «Ficha completa», el ciclo es completa ↔ recogida y Escape no hace nada. En el panel no hay alturas ni anuncios.',
        '**Movimiento:** cambia de altura con `--el-duration-short` y `--el-ease-standard`; mientras el dedo arrastra no hay transición. Con `prefers-reduced-motion` salta a su altura sin animar.',
      ].join('\n\n'),
      'src/components/ui/BottomSheet/',
    ),
  },
} satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj;

export const Half: Story = { name: 'Media (al llegar)', render: () => <Frame /> };
export const Peek: Story = { name: 'Recogida', render: () => <Frame initialDetent="peek" /> };
export const Full: Story = { name: 'Completa', render: () => <Frame initialDetent="full" /> };
export const ShortScreen: Story = {
  name: 'Pantalla baja (390 × 500)',
  render: () => <Frame height={500} />,
  parameters: {
    docs: {
      description: {
        story:
          'El encabezado no cabe en la media: la ficha se comporta como completa, con desplazamiento.',
      },
    },
  },
};
export const DoubleText: Story = {
  name: 'Texto al 200 %',
  render: () => <Frame doubleText />,
  parameters: {
    docs: {
      description: {
        story:
          'Zoom del navegador al 200 % en un celular de 390 × 760 (195 × 380 px CSS): la media se comporta como completa.',
      },
    },
  },
};
export const Desktop: Story = {
  name: 'Escritorio',
  render: () => <Frame desktop />,
  parameters: {
    docs: {
      description: {
        story:
          'Con un contenedor de 1024 px o más, panel fijo de 400 px a la derecha, encabezado y cuerpo seguidos. Más angosto, la misma ficha de celular.',
      },
    },
  },
};
export const Loading: Story = {
  name: 'Cargando',
  render: () => (
    <Frame>
      <BottomSheet
        label="Ficha del lugar"
        detent="half"
        onDetentChange={() => {}}
        title={
          <p role="status" style={{ fontSize: 'var(--el-size-subsection)' }}>
            Cargando el mapa…
          </p>
        }
        header={() => null}
      >
        {null}
      </BottomSheet>
    </Frame>
  ),
};
export const LongestName: Story = {
  name: 'Nombre más largo',
  render: () => <Frame place={SAN_ANDRES} />,
};
export const NoData: Story = {
  name: 'Sin datos',
  render: () => <Frame place={PUERTO_COLOMBIA} />,
  parameters: {
    docs: {
      description: {
        story:
          'Área no municipalizada sin contratos ubicados con certeza: trama y «Sin datos» con el motivo, nunca 0.',
      },
    },
  },
};

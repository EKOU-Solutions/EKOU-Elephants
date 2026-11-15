// Blocks for the MDX pages. They read the guide's sources of truth (tokens.json, contrast-report.json,
// components.json) so Storybook never shows a hand-written value that can go stale.
import { Check, X } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import catalog from '../../docs/design/guide/components.json';
import contrast from '../../docs/design/guide/contrast-report.json';
import tokens from '../../docs/design/guide/tokens.json';
import { ICONS } from '../catalog/shared';

type Mode = 'light' | 'dark';
type Palette = Record<string, string>;
const palettes = tokens.colors as Record<Mode, Palette>;

export function Block({ children }: { children: ReactNode }) {
  return <div className="sb-el">{children}</div>;
}

const STATUS_LABEL = {
  accepted: 'Aceptado',
  candidate: 'Candidato',
  draft: 'Borrador',
  historical: 'Histórico',
} as const;

/** Status of a page or component within the system. */
export function Status({ status, detail }: { status: keyof typeof STATUS_LABEL; detail?: string }) {
  return (
    <p className="sb-el-row" style={{ margin: '8px 0 16px' }}>
      <span className="sb-el-status" data-status={status}>
        {STATUS_LABEL[status]}
      </span>
      {detail ? <span style={{ fontSize: 14 }}>{detail}</span> : null}
    </p>
  );
}

const GROUPS: [string, [string, string][]][] = [
  [
    'Riesgo en el mapa (solo datos)',
    [
      ['risk-low', 'Riesgo bajo'],
      ['risk-medium', 'Riesgo intermedio'],
      ['risk-high', 'Riesgo alto'],
      ['unknown', 'Sin datos suficientes (trama)'],
    ],
  ],
  [
    'Superficies y texto',
    [
      ['surface', 'Superficie'],
      ['surface-subtle', 'Fondo secundario'],
      ['text', 'Texto'],
      ['text-muted', 'Texto secundario'],
      ['line', 'Separador'],
      ['line-strong', 'Línea fuerte'],
      ['control-border', 'Borde de control'],
    ],
  ],
  [
    'Acción',
    [
      ['action', 'Acción y enlace'],
      ['action-hover', 'Acción (hover)'],
      ['action-soft', 'Fondo de acción'],
      ['focus', 'Foco'],
    ],
  ],
  [
    'Mensajes de la interfaz',
    [
      ['warning', 'Advertencia'],
      ['danger', 'Error'],
      ['success', 'Confirmación'],
    ],
  ],
];

function Swatch({ mode, token }: { mode: Mode; token: string }) {
  const value = palettes[mode][token] ?? '';
  const background =
    token === 'unknown'
      ? `repeating-linear-gradient(135deg, ${palettes[mode]['unknown-surface']} 0 3px, ${value} 3px 4px)`
      : value;
  return (
    <td>
      <span className="sb-el-swatch" style={{ background }} />
      <code>{value}</code>
    </td>
  );
}

/** Color table by role, with light and dark values (from tokens.json). */
export function Swatches() {
  return (
    <Block>
      <div style={{ overflowX: 'auto' }}>
        <table className="sb-el-table">
          <thead>
            <tr>
              <th scope="col">Rol y token</th>
              <th scope="col">Claro</th>
              <th scope="col">Oscuro</th>
            </tr>
          </thead>
          <tbody>
            {GROUPS.flatMap(([heading, items]) => [
              <tr className="group" key={heading}>
                <th colSpan={3} scope="colgroup">
                  {heading}
                </th>
              </tr>,
              ...items.map(([token, label]) => (
                <tr key={token}>
                  <th scope="row">
                    {label}
                    <code>--el-color-{token}</code>
                  </th>
                  <Swatch mode="light" token={token} />
                  <Swatch mode="dark" token={token} />
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>
    </Block>
  );
}

type Pair = { usage: string; ratio: number; minimum: number | null; passes: boolean };

/** Contrast checked by build.py in both themes (contrast-report.json). */
export function ContrastTable() {
  const light = contrast.light as Pair[];
  const dark = contrast.dark as Pair[];
  return (
    <Block>
      <div style={{ overflowX: 'auto' }}>
        <table className="sb-el-table">
          <thead>
            <tr>
              <th scope="col">Uso</th>
              <th scope="col" className="num">
                Claro
              </th>
              <th scope="col" className="num">
                Oscuro
              </th>
              <th scope="col" className="num">
                Mínimo
              </th>
            </tr>
          </thead>
          <tbody>
            {light.map((pair, i) => (
              <tr key={pair.usage}>
                <th scope="row">{pair.usage}</th>
                <td className="num">{pair.ratio.toFixed(2)}:1</td>
                <td className="num">{dark[i]?.ratio.toFixed(2)}:1</td>
                <td className="num">{pair.minimum ? `≥ ${pair.minimum}:1` : 'Relieve'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Block>
  );
}

const TYPE_STYLES: [string, string, CSSProperties][] = [
  ['Display · 40 px', 'La plata pública, a la vista', { fontSize: 'var(--el-size-display)', fontWeight: 700, lineHeight: 1.1 }],
  ['Título · 30 / 26 px', 'Contratos de Antioquia', { fontSize: 'var(--el-size-title)', fontWeight: 700, lineHeight: 1.2 }],
  ['Sección · 22 px', 'Obras con retraso', { fontSize: 'var(--el-size-section)', fontWeight: 700 }],
  ['Subtítulo · 18 px', 'Solo una empresa se presentó', { fontSize: 'var(--el-size-subsection)', fontWeight: 700 }],
  ['Texto · 16 px', 'Esta obra lleva 2 años detenida y ya costó 40% más de lo firmado.', { fontSize: 'var(--el-size-body)' }],
  [
    'Secundario · 14 px',
    'Fuente: SECOP II · periodo 2025 · actualizado el 31 dic 2025',
    { fontSize: 'var(--el-size-small)', color: 'var(--el-color-text-muted)' },
  ],
  ['Cifra · 48 / 40 px', '30% · 0% · 1.000', { fontSize: 'var(--el-size-figure)', fontWeight: 700, lineHeight: 1.05 }],
  ['Dígitos tabulares', '0123456789 · $ 12.450.000.000', { fontVariantNumeric: 'tabular-nums lining-nums' }],
];

/** Type scale with Public Sans (fictional data). */
export function TypeScale() {
  return (
    <Block>
      <div className="sb-el-types">
        {TYPE_STYLES.map(([name, sample, style]) => (
          <div key={name}>
            <small>{name}</small>
            <span style={style}>{sample}</span>
          </div>
        ))}
      </div>
    </Block>
  );
}

/** Spacing scale (tokens.json → spacing). */
export function SpacingScale() {
  return (
    <Block>
      <ul className="sb-el-spacing">
        {(tokens.spacing as number[]).map((n) => (
          <li key={n}>
            <span style={{ width: n, height: n }} />
            <code>--el-space-{n}</code>
            <span>{n} px</span>
          </li>
        ))}
      </ul>
    </Block>
  );
}

/** Frequently used icons (Lucide 0.468.0, 2 px stroke). */
export function IconGrid() {
  return (
    <Block>
      <ul className="sb-el-icons">
        {ICONS.map(([Icon, label, name]) => (
          <li key={name}>
            <Icon aria-hidden="true" strokeWidth={2} />
            <span>{label}</span>
            <code>{name}</code>
          </li>
        ))}
      </ul>
    </Block>
  );
}

/** Two columns: what to do and what to avoid. */
export function DoAndDont({ dos, donts }: { dos: ReactNode[]; donts: ReactNode[] }) {
  return (
    <Block>
      <div className="sb-el-do-dont">
        <div className="do">
          <h3>
            <Check aria-hidden="true" />
            Hacer
          </h3>
          <ul>
            {dos.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="dont">
          <h3>
            <X aria-hidden="true" />
            Evitar
          </h3>
          <ul>
            {donts.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </Block>
  );
}

type CatalogEntry = (typeof catalog.components)[number];

/** Catalog summary (components.json): what exists and in which status. */
export function CatalogTable() {
  return (
    <Block>
      <div style={{ overflowX: 'auto' }}>
        <table className="sb-el-table">
          <thead>
            <tr>
              <th scope="col">Componente</th>
              <th scope="col">Estado</th>
              <th scope="col">Clases</th>
            </tr>
          </thead>
          <tbody>
            {catalog.components.map((c: CatalogEntry) => (
              <tr key={c.name}>
                <th scope="row">
                  {c.label_es}
                  <code>{c.name}</code>
                </th>
                <td>
                  <span className="sb-el-status" data-status={c.status === 'core' ? 'accepted' : 'candidate'}>
                    {c.status === 'core' ? 'Núcleo' : 'Candidato'}
                  </span>
                </td>
                <td>
                  <code>{c.classes.join(' · ')}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Block>
  );
}

// The only place that knows which provider draws each icon. Screens ask for an icon by name, so switching
// providers or adding our own SVG changes this file, not the components that use it.
import {
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Download,
  ExternalLink,
  Info,
  LoaderCircle,
  MapPin,
  Search,
  Share2,
  SlidersHorizontal,
  TriangleAlert,
  X,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

/** Any SVG component that accepts the Lucide-style props: a Lucide icon or one of our own. */
export type IconGlyph = ComponentType<
  SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }
>;

/** Approved icon set: name → glyph and its Spanish meaning (shown in Fundamentos/Íconos). */
export const ICONS = {
  search: { glyph: Search, label: 'Buscar' },
  'map-pin': { glyph: MapPin, label: 'Ubicación' },
  'sliders-horizontal': { glyph: SlidersHorizontal, label: 'Filtros' },
  'chevron-down': { glyph: ChevronDown, label: 'Desplegar' },
  info: { glyph: Info, label: 'Información' },
  'triangle-alert': { glyph: TriangleAlert, label: 'Advertencia' },
  'circle-alert': { glyph: CircleAlert, label: 'Error' },
  'circle-check': { glyph: CircleCheck, label: 'Confirmación' },
  'loader-circle': { glyph: LoaderCircle, label: 'Cargando' },
  'external-link': { glyph: ExternalLink, label: 'Fuente externa' },
  'share-2': { glyph: Share2, label: 'Compartir' },
  download: { glyph: Download, label: 'Descargar' },
  x: { glyph: X, label: 'Quitar' },
  check: { glyph: Check, label: 'Hecho' },
} satisfies Record<string, { glyph: IconGlyph; label: string }>;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];

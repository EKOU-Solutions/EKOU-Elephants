import styles from './Icon.module.css';
import { ICONS, type IconName } from './icons';

type Props = {
  /** Nombre del ícono en el conjunto aprobado (`icons.ts`): `name="search"`. */
  name: IconName;
  /** 20 px junto a texto (por defecto), 24 px en alertas; 16 y 18 px en textos pequeños y chips. */
  size?: 16 | 18 | 20 | 24;
  /** Solo si el ícono va sin texto que lo explique: su nombre accesible. Sin `label`, es decorativo. */
  label?: string;
  /** Para que quien lo usa ajuste el espacio o el color a su alrededor. */
  className?: string;
};

/**
 * Dibuja un ícono del conjunto aprobado por su nombre, con trazo de 2 px. Decorativo por defecto:
 * acompaña una palabra que lleva el significado. Quién dibuja cada ícono (Lucide o un SVG propio)
 * se decide solo en `icons.ts`.
 */
export function Icon({ name, size = 20, label, className }: Props) {
  const Glyph = ICONS[name].glyph;
  return (
    <Glyph
      className={`${styles.icon}${className ? ` ${className}` : ''}`}
      size={size}
      strokeWidth={2}
      focusable="false"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    />
  );
}

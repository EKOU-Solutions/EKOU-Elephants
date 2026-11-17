import styles from './SearchResults.module.css';

export interface SearchResult {
  /** Stable key; `onChoose` receives it. */
  id: string;
  name: string;
  /** What tells repeated names apart: the department, or «departamento». */
  context: string;
}

export interface SearchResultsProps {
  /** Must match the search field's `aria-controls`. */
  id: string;
  /** What the person typed. Under 2 letters nothing is listed. */
  query: string;
  /** At most 8 (guide · Search results). */
  results: SearchResult[];
  onChoose: (id: string) => void;
  /**
   * `inline` (por defecto): en el flujo de la página, bajo el campo, que muestra la ayuda de 2 letras.
   * `floating` (v1.6.0): una caja a todo el ancho que flota bajo el campo, sobre lo que haya debajo (el
   * mapa), con altura máxima y su propio desplazamiento; dice también «Escribe al menos 2 letras.». El
   * contenedor del campo y la lista debe estar posicionado.
   */
  variant?: 'inline' | 'floating';
}

const HINT = 'Escribe al menos 2 letras.';

/**
 * Up to 8 places under the search field, each with its department. The `status` region announces
 * only the count (or the hint); the page announces the chosen place and moves focus to its heading.
 */
export function SearchResults({
  id,
  query,
  results,
  onChoose,
  variant = 'inline',
}: SearchResultsProps) {
  const text = query.trim();
  const floating = variant === 'floating';
  const listClass = floating ? `${styles.results} ${styles.floating}` : styles.results;
  // The list always exists (empty and hidden) so the field's `aria-controls` points at something.
  if (text.length < 2) {
    const hint = floating && text.length > 0;
    return (
      <>
        <p className={styles.status} role="status">
          {hint ? HINT : ''}
        </p>
        <ul className={listClass} id={id} hidden={!hint}>
          {hint ? (
            <li className={styles.empty} aria-hidden="true">
              {HINT}
            </li>
          ) : null}
        </ul>
      </>
    );
  }
  const n = Math.min(results.length, 8);
  return (
    <>
      <p className={styles.status} role="status">
        {n ? `${n} ${n === 1 ? 'resultado' : 'resultados'}` : 'Sin resultados'}
      </p>
      <ul className={listClass} id={id}>
        {n ? (
          results.slice(0, 8).map((r) => (
            <li key={r.id}>
              <button type="button" className={styles.option} onClick={() => onChoose(r.id)}>
                {r.name}
                <span className={styles.context}>, {r.context}</span>
              </button>
            </li>
          ))
        ) : (
          <li className={styles.empty}>
            No encontramos «{text}». Revisa la escritura o elige el departamento en el mapa.
          </li>
        )}
      </ul>
    </>
  );
}

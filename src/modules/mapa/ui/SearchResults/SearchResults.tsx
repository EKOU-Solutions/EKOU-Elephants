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
  /** What the person typed. Under 2 letters nothing is listed (the field shows the hint). */
  query: string;
  /** At most 8 (guide · Search results). */
  results: SearchResult[];
  onChoose: (id: string) => void;
}

/**
 * Up to 8 places under the search field, each with its department. The `status` region announces
 * only the count; the page announces the chosen place and moves focus to its heading.
 */
export function SearchResults({ id, query, results, onChoose }: SearchResultsProps) {
  const text = query.trim();
  // The list always exists (empty and hidden) so the field's `aria-controls` points at something.
  if (text.length < 2)
    return (
      <>
        <p className={styles.status} role="status" />
        <ul className={styles.results} id={id} hidden />
      </>
    );
  const n = Math.min(results.length, 8);
  return (
    <>
      <p className={styles.status} role="status">
        {n ? `${n} ${n === 1 ? 'resultado' : 'resultados'}` : 'Sin resultados'}
      </p>
      <ul className={styles.results} id={id}>
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

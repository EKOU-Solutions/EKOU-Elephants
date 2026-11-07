import { useEffect, useState } from 'react';
import type { ResumenTerritorial as Resumen } from '../domain/resumen-territorial';

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'ok'; resumen: Resumen };

export function ResumenTerritorial({ codigo }: { codigo: string }) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });

  useEffect(() => {
    const control = new AbortController();
    setEstado({ tipo: 'cargando' });
    fetch(`/api/mapa/territorios/${codigo}/resumen`, { signal: control.signal })
      .then((r) => (r.ok ? (r.json() as Promise<Resumen>) : Promise.reject(new Error(String(r.status)))))
      .then((resumen) => setEstado({ tipo: 'ok', resumen }))
      .catch((e) => e.name !== 'AbortError' && setEstado({ tipo: 'error' }));
    return () => control.abort();
  }, [codigo]);

  if (estado.tipo === 'cargando') return <p>Cargando…</p>;
  if (estado.tipo === 'error') return <p role="alert">No pudimos cargar la información.</p>;
  const { nombre, presupuestoAsignado, gastoActual, totalObras, obrasConRetraso } = estado.resumen;
  return (
    <section>
      <h2>{nombre}</h2>
      <p>Presupuesto: {presupuestoAsignado.toLocaleString('es-CO')} · Gasto: {gastoActual.toLocaleString('es-CO')}</p>
      <p>Obras: {totalObras} ({obrasConRetraso} con señales de retraso)</p>
    </section>
  );
}

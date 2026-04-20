import { useParams } from 'react-router-dom';

export function MenuPage() {
  const { tenantSlug, tableId } = useParams();
  return (
    <main>
      <h1>{tenantSlug} · masa {tableId}</h1>
      <p>Menü buraya gelecek.</p>
    </main>
  );
}

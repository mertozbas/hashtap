import { Card, Badge } from '@hashtap/ui';

interface Table {
  id: string;
  label: string;
  status: 'free' | 'open' | 'needs-bill';
  activeOrderId?: string;
}

const DEMO_TABLES: Table[] = Array.from({ length: 12 }, (_, i) => ({
  id: `t-${i + 1}`,
  label: String(i + 1),
  status: i % 5 === 0 ? 'needs-bill' : i % 3 === 0 ? 'open' : 'free',
}));

const tone = {
  free: 'neutral' as const,
  open: 'warning' as const,
  'needs-bill': 'danger' as const,
};

const label = {
  free: 'boş',
  open: 'açık',
  'needs-bill': 'hesap bekliyor',
};

export function TablesScreen() {
  return (
    <div className="mx-auto max-w-6xl">
      <h2 className="mb-4 text-2xl font-semibold">Salon haritası</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {DEMO_TABLES.map((table) => (
          <Card key={table.id} padding="sm" radius="lg" interactive>
            <div className="flex items-center justify-between">
              <div className="text-4xl font-black tabular-nums">{table.label}</div>
              <Badge tone={tone[table.status]}>{label[table.status]}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Card, Badge, cn } from '@hashtap/ui';
import { DEMO_TABLES, statusLabel, statusTone } from '../lib/tables.js';

export function TablesScreen() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Salon</h1>
      <div className="grid grid-cols-2 gap-3">
        {DEMO_TABLES.map((t) => (
          <Link key={t.id} to={`/tables/${t.id}`}>
            <Card
              padding="sm"
              radius="lg"
              interactive
              className={cn(
                'h-28 flex-col justify-between',
                t.status === 'ready-pickup' ? 'border-state-success/60' : '',
                t.status === 'needs-bill' ? 'border-state-danger/60' : '',
              )}
            >
              <div className="flex items-start justify-between">
                <span className="text-4xl font-black tabular-nums">{t.label}</span>
                <Badge tone={statusTone(t.status)}>{statusLabel(t.status)}</Badge>
              </div>
              <div className="text-xs text-textc-muted">
                {t.guestCount ? `${t.guestCount} kişi` : 'boş'}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

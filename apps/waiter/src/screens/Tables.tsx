import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Skeleton, EmptyState, cn } from '@hashtap/ui';
import { Grid3x3 } from 'lucide-react';
import { fetchTables, type PosTable, type TableStatus } from '../lib/pos.js';

const STATUS_LABEL: Record<TableStatus, string> = {
  free: 'boş',
  open: 'açık',
  occupied: 'açık',
  ready: 'hazır',
};

const STATUS_TONE: Record<TableStatus, 'neutral' | 'warning' | 'success'> = {
  free: 'neutral',
  open: 'warning',
  occupied: 'warning',
  ready: 'success',
};

const STATUS_BORDER: Record<TableStatus, string> = {
  free: '',
  open: 'border-state-warning/40',
  occupied: 'border-state-warning/40',
  ready: 'border-state-success/60',
};

function fmtKurus(k: number) {
  return `${(k / 100).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₺`;
}

export function TablesScreen() {
  const [tables, setTables] = useState<PosTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    function load() {
      fetchTables()
        .then((data) => {
          if (!cancelled) {
            setTables(data);
            setError(null);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : 'unknown');
            setLoading(false);
          }
        });
    }
    load();
    const iv = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(iv);
    };
  }, []);

  const byFloor = useMemo(() => {
    return tables.reduce<Record<string, PosTable[]>>((acc, t) => {
      (acc[t.floor] ||= []).push(t);
      return acc;
    }, {});
  }, [tables]);

  if (loading && tables.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <EmptyState icon={<Grid3x3 />} title="Salon yüklenemedi" description={error} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">Salon</h1>
      {Object.entries(byFloor).map(([floor, items]) => (
        <div key={floor}>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-textc-secondary">
            {floor || 'Salon'}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {items.map((t) => (
              <Link key={t.id} to={`/tables/${t.id}`}>
                <Card
                  padding="sm"
                  radius="lg"
                  interactive
                  className={cn(
                    'h-28 flex-col justify-between',
                    STATUS_BORDER[t.status],
                    t.status === 'ready' ? 'animate-pulse' : '',
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-4xl font-black tabular-nums">{t.name}</span>
                    <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                  </div>
                  <div className="text-xs text-textc-muted">
                    {t.active_order_count > 0
                      ? `${fmtKurus(t.active_total_kurus)} · ${t.active_order_count} sipariş`
                      : `${t.seats} kişilik`}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

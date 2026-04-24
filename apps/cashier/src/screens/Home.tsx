import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardTitle, CardDescription, Badge, Skeleton, cn } from '@hashtap/ui';
import { formatKurus } from '../lib/format.js';
import { fetchTables, type PosTable, type TableStatus } from '../lib/pos.js';

const STATUS_LABEL: Record<TableStatus, string> = {
  free: 'boş',
  open: 'açık',
  occupied: 'sipariş alındı',
  ready: 'hazır!',
};

const STATUS_TONE: Record<TableStatus, 'neutral' | 'warning' | 'info' | 'success'> = {
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

export function HomeScreen() {
  const [tables, setTables] = useState<PosTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let interval: number | undefined;
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
    interval = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
    };
  }, []);

  const stats = useMemo(() => {
    const active = tables.filter((t) => t.status !== 'free');
    const total = active.reduce((sum, t) => sum + t.active_total_kurus, 0);
    const byFloor = tables.reduce<Record<string, PosTable[]>>((acc, t) => {
      (acc[t.floor] ||= []).push(t);
      return acc;
    }, {});
    return {
      free: tables.filter((t) => t.status === 'free').length,
      open: tables.filter((t) => t.status === 'open' || t.status === 'occupied').length,
      ready: tables.filter((t) => t.status === 'ready').length,
      activeRevenueKurus: total,
      byFloor,
    };
  }, [tables]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <CardTitle>Salon</CardTitle>
            <CardDescription>Aktif masa ve sipariş özeti (5 sn aralıkla yenileniyor)</CardDescription>
          </div>
          <Badge tone="brand" dot pulsing>Canlı</Badge>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
          <div>
            <div className="text-4xl font-black tabular-nums">{stats.open}</div>
            <div className="mt-1 text-xs uppercase tracking-wide text-textc-muted">Açık</div>
          </div>
          <div>
            <div className="text-4xl font-black tabular-nums text-state-success">{stats.ready}</div>
            <div className="mt-1 text-xs uppercase tracking-wide text-textc-muted">Hazır</div>
          </div>
          <div>
            <div className="text-4xl font-black tabular-nums text-textc-muted">{stats.free}</div>
            <div className="mt-1 text-xs uppercase tracking-wide text-textc-muted">Boş</div>
          </div>
          <div>
            <div className="text-3xl font-bold tabular-nums">{formatKurus(stats.activeRevenueKurus)}</div>
            <div className="mt-1 text-xs uppercase tracking-wide text-textc-muted">Açık ciro</div>
          </div>
        </div>
      </Card>

      {loading && tables.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardTitle>Salon yüklenemedi</CardTitle>
          <CardDescription className="mt-2">
            Gateway'e ulaşılamadı ({error}). Odoo + gateway çalışıyor mu?
          </CardDescription>
        </Card>
      ) : (
        Object.entries(stats.byFloor).map(([floor, items]) => (
          <div key={floor}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-textc-secondary">
              {floor || 'Salon'}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {items.map((t) => (
                <Link key={t.id} to={`/tables/${t.id}`}>
                  <Card
                    padding="sm"
                    radius="lg"
                    interactive
                    className={cn(
                      'h-32 flex-col justify-between',
                      STATUS_BORDER[t.status],
                      t.status === 'ready' ? 'animate-pulse' : '',
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-4xl font-black tabular-nums">{t.name}</span>
                      <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                    </div>
                    <div className="text-xs text-textc-muted">
                      {t.active_order_count > 0 ? (
                        <>
                          <span className="tabular-nums">{formatKurus(t.active_total_kurus)}</span>
                          {' · '}
                          <span>{t.active_order_count} sipariş</span>
                        </>
                      ) : (
                        <span>{t.seats} kişilik</span>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

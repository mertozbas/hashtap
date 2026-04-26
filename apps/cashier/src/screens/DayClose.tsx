import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Badge,
  Skeleton,
  EmptyState,
  useToast,
} from '@hashtap/ui';
import { ChevronLeft, FileSpreadsheet, ClipboardCheck } from 'lucide-react';
import { formatKurus } from '../lib/format.js';
import {
  closeDay,
  fetchDayClosures,
  fetchDaySummary,
  type DayClosureRow,
  type DaySummary,
} from '../lib/pos.js';

const METHOD_LABEL: Record<string, string> = {
  cash: 'Nakit',
  card: 'Kart (3DS)',
  card_manual: 'Kart (harici)',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  pay_at_counter: 'Karma',
  unknown: 'Belirsiz',
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DayCloseScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const [day, setDay] = useState(todayIso());
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [closures, setClosures] = useState<DayClosureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cashCounted, setCashCounted] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchDaySummary(day), fetchDayClosures()])
      .then(([s, list]) => {
        if (cancelled) return;
        setSummary(s);
        setClosures(list);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.show({
            title: 'Veri yüklenemedi',
            description: err instanceof Error ? err.message : 'unknown',
            tone: 'error',
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [day, toast]);

  const cashSystem = summary?.by_method.find((m) => m.method_code === 'cash')
    ?.total_kurus ?? 0;
  const cashCountedKurus = Math.round(parseFloat(cashCounted || '0') * 100);
  const diffKurus =
    cashCounted.trim() === '' ? null : cashCountedKurus - cashSystem;

  async function close() {
    if (!summary) return;
    if (cashCounted.trim() === '') {
      toast.show({ title: 'Sayım girilmedi', tone: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await closeDay(day, cashCountedKurus, note);
      toast.show({
        title: `Z raporu kaydedildi (#${res.z_report_id})`,
        description:
          res.diff_kurus === 0
            ? 'Sayım sistemle uyumlu'
            : res.diff_kurus !== null && res.diff_kurus > 0
              ? `Fazla: ${formatKurus(res.diff_kurus)}`
              : `Eksik: ${formatKurus(-(res.diff_kurus ?? 0))}`,
        tone: 'success',
      });
      setCashCounted('');
      setNote('');
      const list = await fetchDayClosures();
      setClosures(list);
    } catch (err) {
      toast.show({
        title: 'Kapanış başarısız',
        description: err instanceof Error ? err.message : 'unknown',
        tone: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/')}
          aria-label="Salon"
          className="!h-10 !w-10 !p-0"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Gün sonu (Z raporu)</h1>
          <p className="mt-1 text-xs text-textc-muted">
            Günü kapat: kasada saydığın nakitle sistem nakdi karşılaştırılır.
          </p>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Input
            label="Gün"
            type="date"
            value={day}
            onChange={(e) => setDay(e.currentTarget.value)}
            className="!w-44"
          />
          <Badge tone="brand" dot pulsing>{day}</Badge>
        </div>
        {loading || !summary ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Sipariş" value={summary.totals.order_count.toString()} />
            <Stat label="Ödenen" value={summary.totals.paid_count.toString()} />
            <Stat
              label="Brüt"
              value={formatKurus(summary.totals.gross_kurus)}
              small
            />
            <Stat
              label="Tahsilat"
              value={formatKurus(summary.totals.collected_kurus)}
              small
              accent
            />
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Ödeme yöntemine göre</CardTitle>
        {summary && summary.by_method.length > 0 ? (
          <ul className="mt-4 divide-y divide-white/6">
            {summary.by_method.map((m) => (
              <li
                key={m.method_code}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm font-semibold">
                  {METHOD_LABEL[m.method_code] || m.method_code}
                </span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-textc-muted">{m.order_count} sipariş</span>
                  <span className="tabular-nums font-bold">
                    {formatKurus(m.total_kurus)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <CardDescription className="mt-2">
            Bu gün için ödeme bulunmuyor.
          </CardDescription>
        )}
      </Card>

      <Card>
        <CardTitle>Kasa sayımı</CardTitle>
        <CardDescription className="mt-1">
          Kasada saydığın fiziksel nakit tutarını yaz. Sistem nakit ile farkı Z
          raporuna işlenir.
        </CardDescription>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr]">
          <Input
            label="Sayım nakit (₺)"
            placeholder="0,00"
            value={cashCounted}
            onChange={(e) => setCashCounted(e.currentTarget.value)}
            inputMode="decimal"
          />
          <div>
            <span className="block text-sm font-medium text-textc-secondary">
              Sistem nakit
            </span>
            <div className="ht-glass h-touch flex items-center rounded-lg border border-white/14 px-3 text-base tabular-nums">
              {formatKurus(cashSystem)}
            </div>
          </div>
          <div>
            <span className="block text-sm font-medium text-textc-secondary">Fark</span>
            <div
              className={`ht-glass h-touch flex items-center rounded-lg border px-3 text-base tabular-nums ${
                diffKurus === null
                  ? 'border-white/14 text-textc-muted'
                  : diffKurus === 0
                    ? 'border-state-success/40 text-state-success'
                    : diffKurus > 0
                      ? 'border-state-info/40 text-state-info'
                      : 'border-state-danger/40 text-state-danger'
              }`}
            >
              {diffKurus === null
                ? '—'
                : diffKurus === 0
                  ? 'Uyumlu'
                  : diffKurus > 0
                    ? `+${formatKurus(diffKurus)}`
                    : formatKurus(diffKurus)}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <Input
            label="Not"
            placeholder="Bozuk para iadesi, banka avansı vs. (opsiyonel)"
            value={note}
            onChange={(e) => setNote(e.currentTarget.value)}
          />
        </div>
        <Button
          size="lg"
          fullWidth
          className="mt-4"
          onClick={close}
          loading={submitting}
          leftIcon={<ClipboardCheck className="h-5 w-5" />}
        >
          Günü kapat
        </Button>
      </Card>

      <Card>
        <CardTitle>Geçmiş Z raporları</CardTitle>
        {closures.length === 0 ? (
          <EmptyState
            icon={<FileSpreadsheet />}
            title="Henüz kapanış yok"
            description="İlk günü kapattığında buraya düşer."
          />
        ) : (
          <ul className="mt-4 divide-y divide-white/6">
            {closures.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 py-2"
              >
                <div>
                  <div className="text-sm font-semibold">{c.day ?? '—'}</div>
                  <div className="text-xs text-textc-muted">
                    {c.order_count} sipariş ·{' '}
                    {c.closed_at
                      ? new Date(c.closed_at).toLocaleString('tr-TR')
                      : ''}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="tabular-nums">
                    {formatKurus(c.collected_kurus)}
                  </span>
                  <Badge
                    tone={
                      c.diff_kurus === 0
                        ? 'success'
                        : c.diff_kurus > 0
                          ? 'info'
                          : 'danger'
                    }
                  >
                    {c.diff_kurus === 0
                      ? 'uyumlu'
                      : c.diff_kurus > 0
                        ? `+${formatKurus(c.diff_kurus)}`
                        : formatKurus(c.diff_kurus)}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  small,
  accent,
}: {
  label: string;
  value: string;
  small?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={`font-black tabular-nums ${
          small ? 'text-2xl' : 'text-4xl'
        } ${accent ? 'text-state-success' : ''}`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wide text-textc-muted">
        {label}
      </div>
    </div>
  );
}

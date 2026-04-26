import { useEffect, useMemo, useState } from 'react';
import { Modal, Button, Input } from '@hashtap/ui';
import { Plus, Trash2 } from 'lucide-react';
import { formatKurus } from '../lib/format.js';
import type { BillSplit, PaymentMethodCode, PosOrder } from '../lib/pos.js';

interface DraftSplit {
  id: string;
  amountTl: string; // input as string for free typing, parse on submit
  method: PaymentMethodCode;
}

const METHOD_LABELS: Record<PaymentMethodCode, string> = {
  cash: 'Nakit',
  card_manual: 'Kredi kartı (harici)',
  pay_at_counter: 'Diğer / karma',
};

interface Props {
  order: PosOrder | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (splits: BillSplit[]) => Promise<void>;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function SplitBillModal({ order, open, onClose, onConfirm }: Props) {
  const [splits, setSplits] = useState<DraftSplit[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !order) return;
    const remaining = (order.total_kurus - order.paid_amount_kurus) / 100;
    // Varsayılan: 2 eşit parça (kullanıcı düzenleyebilir)
    const half = (remaining / 2).toFixed(2);
    setSplits([
      { id: uid(), amountTl: half, method: 'cash' },
      { id: uid(), amountTl: (remaining - parseFloat(half)).toFixed(2), method: 'card_manual' },
    ]);
  }, [open, order?.id]);

  if (!order) return null;
  const remainingKurus = order.total_kurus - order.paid_amount_kurus;

  const totals = useMemo(() => {
    let totalKurus = 0;
    for (const s of splits) {
      const amt = Math.round(parseFloat(s.amountTl || '0') * 100);
      if (Number.isFinite(amt)) totalKurus += amt;
    }
    return { totalKurus, diffKurus: totalKurus - remainingKurus };
  }, [splits, remainingKurus]);

  const valid = totals.diffKurus === 0 && splits.every(
    (s) => parseFloat(s.amountTl || '0') > 0,
  );

  function update(id: string, patch: Partial<DraftSplit>) {
    setSplits((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function add() {
    setSplits((prev) => [...prev, { id: uid(), amountTl: '0.00', method: 'cash' }]);
  }

  function remove(id: string) {
    setSplits((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));
  }

  function distributeEqually() {
    const n = splits.length || 1;
    const baseKurus = Math.floor(remainingKurus / n);
    const remainder = remainingKurus - baseKurus * n;
    setSplits((prev) =>
      prev.map((s, i) => ({
        ...s,
        amountTl: ((baseKurus + (i === n - 1 ? remainder : 0)) / 100).toFixed(2),
      })),
    );
  }

  async function submit() {
    if (!valid) return;
    setSubmitting(true);
    try {
      const payload: BillSplit[] = splits.map((s) => ({
        amount_kurus: Math.round(parseFloat(s.amountTl) * 100),
        method_code: s.method,
      }));
      await onConfirm(payload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Hesabı böl"
      description={`${order.reference} · kalan ${formatKurus(remainingKurus)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>İptal</Button>
          <Button onClick={submit} disabled={!valid} loading={submitting}>
            Tahsil et · {formatKurus(totals.totalKurus)}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={distributeEqually}>
            Eşit böl
          </Button>
          <Button variant="secondary" size="sm" onClick={add} leftIcon={<Plus className="h-4 w-4" />}>
            Parça ekle
          </Button>
        </div>
        <ul className="space-y-2">
          {splits.map((s) => (
            <li key={s.id} className="flex items-end gap-2">
              <Input
                label="Tutar (₺)"
                value={s.amountTl}
                onChange={(e) => update(s.id, { amountTl: e.currentTarget.value })}
                inputMode="decimal"
                className="text-right"
              />
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-textc-secondary">Yöntem</span>
                <select
                  value={s.method}
                  onChange={(e) => update(s.id, { method: e.currentTarget.value as PaymentMethodCode })}
                  className="ht-glass h-touch rounded-lg border border-white/14 px-3 text-sm text-textc-primary focus-visible:outline-none focus-visible:border-brand-500"
                >
                  {(['cash', 'card_manual', 'pay_at_counter'] as PaymentMethodCode[]).map((m) => (
                    <option key={m} value={m}>{METHOD_LABELS[m]}</option>
                  ))}
                </select>
              </label>
              {splits.length > 1 ? (
                <Button
                  variant="tertiary"
                  size="sm"
                  className="!h-touch !w-touch !p-0"
                  onClick={() => remove(s.id)}
                  aria-label="Parçayı sil"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        {totals.diffKurus !== 0 ? (
          <p className="text-sm text-state-warning">
            {totals.diffKurus > 0
              ? `Fazla: ${formatKurus(totals.diffKurus)}`
              : `Eksik: ${formatKurus(-totals.diffKurus)}`}
          </p>
        ) : (
          <p className="text-sm text-state-success">Toplam doğrulandı.</p>
        )}
      </div>
    </Modal>
  );
}

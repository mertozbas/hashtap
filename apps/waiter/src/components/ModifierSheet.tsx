import { useEffect, useMemo, useState } from 'react';
import { Modal, Button, Badge } from '@hashtap/ui';
import { Plus } from 'lucide-react';
import type { MenuItem, ModifierGroup } from '../lib/pos.js';

const formatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  maximumFractionDigits: 2,
});
function fmt(k: number) {
  return formatter.format(k / 100);
}

export interface ModifierSelection {
  modifierIds: number[];
  modifierNames: string[];
  modifierDeltaKurus: number;
  note: string;
}

interface Props {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (sel: ModifierSelection) => void;
}

export function ModifierSheet({ item, open, onClose, onConfirm }: Props) {
  const [selected, setSelected] = useState<Record<number, number[]>>({});
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setSelected({});
      setNote('');
    }
  }, [open, item?.id]);

  if (!item) return null;
  const groups = item.modifier_groups;

  const summary = useMemo(() => {
    const flatIds: number[] = [];
    const names: string[] = [];
    let delta = 0;
    for (const g of groups) {
      const picks = selected[g.id] || [];
      for (const id of picks) {
        const m = g.modifiers.find((x) => x.id === id);
        if (!m) continue;
        flatIds.push(m.id);
        names.push(m.name.tr);
        delta += m.price_delta_kurus;
      }
    }
    return { flatIds, names, delta };
  }, [groups, selected]);

  const totalKurus = item.price_kurus + summary.delta;

  const validation = useMemo(() => {
    for (const g of groups) {
      const picks = selected[g.id] || [];
      if (picks.length < g.min_select)
        return { ok: false, message: `"${g.name.tr}" en az ${g.min_select}` };
      if (picks.length > g.max_select)
        return { ok: false, message: `"${g.name.tr}" en fazla ${g.max_select}` };
    }
    return { ok: true, message: '' };
  }, [groups, selected]);

  function toggle(group: ModifierGroup, modifierId: number) {
    setSelected((prev) => {
      const current = prev[group.id] || [];
      if (current.includes(modifierId))
        return { ...prev, [group.id]: current.filter((id) => id !== modifierId) };
      if (group.max_select === 1) return { ...prev, [group.id]: [modifierId] };
      if (current.length >= group.max_select) return prev;
      return { ...prev, [group.id]: [...current, modifierId] };
    });
  }

  function handleConfirm() {
    if (!validation.ok) return;
    onConfirm({
      modifierIds: summary.flatIds,
      modifierNames: summary.names,
      modifierDeltaKurus: summary.delta,
      note: note.trim().slice(0, 300),
    });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={item.name.tr}
      description={item.description.tr || undefined}
      footer={
        <>
          {!validation.ok ? (
            <span className="self-center mr-auto text-xs text-state-warning">
              {validation.message}
            </span>
          ) : null}
          <Button variant="secondary" onClick={onClose} size="sm">İptal</Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={!validation.ok}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            {fmt(totalKurus)}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {groups.map((g) => {
          const picks = selected[g.id] || [];
          return (
            <div key={g.id}>
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="text-sm font-semibold">{g.name.tr}</h3>
                <Badge tone={g.min_select > 0 ? 'warning' : 'neutral'}>
                  {g.min_select > 0 ? 'Zorunlu' : 'Ops.'}
                </Badge>
              </div>
              <ul className="grid grid-cols-1 gap-1.5">
                {g.modifiers.map((m) => {
                  const checked = picks.includes(m.id);
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => toggle(g, m.id)}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                          checked
                            ? 'border-brand-500 bg-brand-500/15'
                            : 'border-white/10 bg-white/4'
                        }`}
                      >
                        <span className="font-semibold">{m.name.tr}</span>
                        <span className="text-xs tabular-nums">
                          {m.price_delta_kurus > 0
                            ? `+${fmt(m.price_delta_kurus)}`
                            : ''}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        <textarea
          value={note}
          onChange={(e) => setNote(e.currentTarget.value)}
          placeholder="Not (opsiyonel)"
          rows={2}
          maxLength={300}
          className="ht-glass w-full rounded-lg border border-white/14 px-3 py-2 text-sm text-textc-primary focus-visible:outline-none focus-visible:border-brand-500"
        />
      </div>
    </Modal>
  );
}

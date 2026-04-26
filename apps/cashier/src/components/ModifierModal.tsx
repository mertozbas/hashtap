import { useEffect, useMemo, useState } from 'react';
import { Modal, Button, Badge } from '@hashtap/ui';
import { Plus } from 'lucide-react';
import type { MenuItem, ModifierGroup } from '../lib/menu.js';
import { formatKurus } from '../lib/format.js';

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

export function ModifierModal({ item, open, onClose, onConfirm }: Props) {
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
        return { ok: false, message: `"${g.name.tr}" en az ${g.min_select} seçim` };
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
      if (group.max_select === 1)
        return { ...prev, [group.id]: [modifierId] };
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
      size="md"
      title={item.name.tr}
      description={item.description.tr || undefined}
      footer={
        <>
          {!validation.ok ? (
            <span className="text-sm text-state-warning self-center mr-auto">
              {validation.message}
            </span>
          ) : null}
          <Button variant="secondary" onClick={onClose}>İptal</Button>
          <Button
            onClick={handleConfirm}
            disabled={!validation.ok}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Sepete · {formatKurus(totalKurus)}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {groups.map((g) => {
          const picks = selected[g.id] || [];
          const required = g.min_select > 0;
          return (
            <div key={g.id}>
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="text-base font-semibold">{g.name.tr}</h3>
                <Badge tone={required ? 'warning' : 'neutral'}>
                  {required
                    ? g.max_select === 1
                      ? 'Zorunlu — 1 seç'
                      : `Min ${g.min_select} / Max ${g.max_select}`
                    : g.max_select === 1
                      ? 'Opsiyonel'
                      : `Opsiyonel max ${g.max_select}`}
                </Badge>
              </div>
              <ul className="grid grid-cols-2 gap-2">
                {g.modifiers.map((m) => {
                  const checked = picks.includes(m.id);
                  return (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => toggle(g, m.id)}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                          checked
                            ? 'border-brand-500 bg-brand-500/15 text-textc-primary'
                            : 'border-white/10 bg-white/4 text-textc-secondary hover:bg-white/8'
                        }`}
                      >
                        <span className="font-semibold">{m.name.tr}</span>
                        <span className="tabular-nums text-xs">
                          {m.price_delta_kurus > 0
                            ? `+${formatKurus(m.price_delta_kurus)}`
                            : m.price_delta_kurus < 0
                              ? formatKurus(m.price_delta_kurus)
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

        <div>
          <label className="mb-1 block text-sm font-medium text-textc-secondary">
            Not
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.currentTarget.value)}
            placeholder="Pişirme tercihi, alerji notu (opsiyonel)"
            rows={2}
            maxLength={300}
            className="ht-glass w-full rounded-lg border border-white/14 px-3 py-2 text-sm text-textc-primary focus-visible:outline-none focus-visible:border-brand-500"
          />
        </div>
      </div>
    </Modal>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus } from 'lucide-react';
import type { MenuItem, ModifierGroup } from '../api/menu.js';

export interface ModifierSelection {
  modifierIds: number[];
  modifierNames: string[];
  modifierDeltaKurus: number;
  note: string;
}

function priceLabel(kurus: number, currency: string) {
  const symbol = currency === 'TRY' ? '₺' : currency;
  return `${(kurus / 100).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${symbol}`;
}

interface Props {
  item: MenuItem;
  currency: string;
  open: boolean;
  onClose: () => void;
  onConfirm: (sel: ModifierSelection) => void;
}

export function ModifierModal({ item, currency, open, onClose, onConfirm }: Props) {
  const [selected, setSelected] = useState<Record<number, number[]>>({});
  const [note, setNote] = useState('');

  // open değiştiğinde temiz başla
  useEffect(() => {
    if (open) {
      setSelected({});
      setNote('');
    }
  }, [open, item.id]);

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
      if (picks.length < g.min_select) {
        return {
          ok: false,
          message: `"${g.name.tr}" için en az ${g.min_select} seçim yapın`,
        };
      }
      if (picks.length > g.max_select) {
        return {
          ok: false,
          message: `"${g.name.tr}" için en fazla ${g.max_select} seçim`,
        };
      }
    }
    return { ok: true, message: '' };
  }, [groups, selected]);

  function toggle(group: ModifierGroup, modifierId: number) {
    setSelected((prev) => {
      const current = prev[group.id] || [];
      if (current.includes(modifierId)) {
        return { ...prev, [group.id]: current.filter((id) => id !== modifierId) };
      }
      // max_select=1 → radio davranışı
      if (group.max_select === 1) {
        return { ...prev, [group.id]: [modifierId] };
      }
      // max'ı aşma
      if (current.length >= group.max_select) {
        return prev;
      }
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
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modifier-title"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-stone-50 sm:rounded-t-3xl sm:rounded-3xl"
          >
            <div className="sticky top-0 bg-stone-50 border-b border-stone-200 px-5 py-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="modifier-title" className="font-serif text-stone-900 text-xl">
                  {item.name.tr}
                </h2>
                {item.description.tr ? (
                  <p className="font-serif italic text-stone-500 text-sm mt-1">
                    {item.description.tr}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Kapat"
                className="shrink-0 w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-6">
              {groups.map((g) => {
                const picks = selected[g.id] || [];
                const isRequired = g.min_select > 0;
                return (
                  <div key={g.id}>
                    <div className="flex items-baseline justify-between mb-3">
                      <h3 className="font-serif text-stone-800 text-base">{g.name.tr}</h3>
                      <span className="text-[11px] tracking-[0.12em] uppercase text-stone-400">
                        {isRequired
                          ? g.max_select === 1
                            ? 'Zorunlu — 1 seç'
                            : `Zorunlu — en az ${g.min_select}`
                          : g.max_select === 1
                            ? 'Opsiyonel'
                            : `Opsiyonel — max ${g.max_select}`}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {g.modifiers.map((m) => {
                        const checked = picks.includes(m.id);
                        return (
                          <li key={m.id}>
                            <button
                              type="button"
                              onClick={() => toggle(g, m.id)}
                              className={`w-full flex items-center justify-between gap-3 px-3 py-3 border text-left transition ${
                                checked
                                  ? 'border-stone-900 bg-stone-900 text-white'
                                  : 'border-stone-300 bg-white text-stone-800 hover:border-stone-500'
                              }`}
                            >
                              <span className="font-serif text-base">{m.name.tr}</span>
                              <span className="font-serif text-sm">
                                {m.price_delta_kurus > 0
                                  ? `+${priceLabel(m.price_delta_kurus, currency)}`
                                  : m.price_delta_kurus < 0
                                    ? priceLabel(m.price_delta_kurus, currency)
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
                <h3 className="font-serif text-stone-800 text-base mb-2">Not</h3>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.currentTarget.value)}
                  placeholder="Alerji, pişirme tercihi (opsiyonel)"
                  rows={2}
                  className="w-full border border-stone-300 bg-white px-3 py-2 text-sm font-serif text-stone-800 focus:outline-none focus:border-stone-900"
                  maxLength={300}
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-stone-50 border-t border-stone-200 px-5 py-4">
              {!validation.ok ? (
                <p className="font-serif italic text-[#c2410c] text-sm mb-2">
                  {validation.message}
                </p>
              ) : null}
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!validation.ok}
                className="w-full flex items-center justify-between gap-3 bg-stone-900 text-white px-5 py-4 disabled:bg-stone-400 disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-3">
                  <Plus className="w-4 h-4" />
                  <span className="font-serif italic text-lg">Sepete ekle</span>
                </span>
                <span className="font-serif text-lg">{priceLabel(totalKurus, currency)}</span>
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

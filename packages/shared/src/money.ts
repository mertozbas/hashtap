/**
 * Para her yerde tam sayı olarak "kuruş" cinsinden taşınır.
 * Float asla kullanılmaz — yuvarlama hataları muhasebe ve POS senkronu bozar.
 */

export type Kurus = number;

export function trFormat(kurus: Kurus): string {
  const lira = kurus / 100;
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(lira);
}

export function fromLiraString(s: string): Kurus {
  const normalized = s.replace(/[^0-9,.]/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(normalized);
  if (!Number.isFinite(n)) throw new Error(`invalid lira string: ${s}`);
  return Math.round(n * 100);
}

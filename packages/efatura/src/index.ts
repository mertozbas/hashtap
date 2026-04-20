import type { Kurus } from '@hashtap/shared';

/**
 * e-Arşiv fişi entegratör sözleşmesi.
 *
 * Türkiye'de gıda satışı için ÖKC + e-Arşiv zorunluluğu. HashTap bir entegratör
 * üzerinden (Foriba, Uyumsoft, Logo eFatura, Mysoft) elektronik fiş keser.
 *
 * Karar: restoranın mevcut entegratörüyle uyumlu çalışırız (hashcash.md §13.3).
 */

export type ReceiptLine = {
  name: string;
  qty: number;
  unitPriceKurus: Kurus;
  vatRate: number;
};

export type ReceiptInput = {
  tenantId: string;
  orderId: string;
  totalKurus: Kurus;
  lines: ReceiptLine[];
  buyer: { name?: string; taxId?: string; email?: string };
  issuedAt: string;
};

export type Receipt = {
  uuid: string;
  pdfUrl: string;
  sentToGib: boolean;
};

export interface EfaturaProvider {
  readonly provider: 'foriba' | 'uyumsoft' | 'logo' | 'mysoft';
  issueReceipt(input: ReceiptInput): Promise<Receipt>;
  cancelReceipt(uuid: string, reason: string): Promise<void>;
}

export class ForibaProvider implements EfaturaProvider {
  readonly provider = 'foriba' as const;
  constructor(private readonly config: { username: string; password: string; baseUrl: string }) {}

  async issueReceipt(_input: ReceiptInput): Promise<Receipt> {
    throw new Error('ForibaProvider.issueReceipt: not implemented');
  }
  async cancelReceipt(_uuid: string, _reason: string): Promise<void> {
    throw new Error('ForibaProvider.cancelReceipt: not implemented');
  }
}

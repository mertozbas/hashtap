import type { Kurus } from '@hashtap/shared';

/**
 * Ödeme gateway sözleşmesi.
 *
 * HashTap "facilitator" modelini uygular: para restoranın kendi subMerchant
 * hesabına akar, biz ödemeyi tetikleyen + webhook'u doğrulayan katmanız.
 * MASAK/BDDK ödeme kuruluşu lisansı gerektirmez.
 */

export type PaymentIntentInput = {
  tenantId: string;
  orderId: string;
  amountKurus: Kurus;
  tipKurus: Kurus;
  currency: 'TRY';
  buyer: { name?: string; email?: string; phone?: string; locale: 'tr' | 'en' };
  returnUrl: string;
};

export type PaymentIntent = {
  providerPaymentId: string;
  redirectUrl: string;
  expiresAt: string;
};

export type PaymentWebhookPayload = {
  providerPaymentId: string;
  status: 'paid' | 'failed' | 'refunded';
  amountKurus: Kurus;
  tipKurus: Kurus;
  gatewayTxId: string;
  raw: unknown;
};

export interface PaymentGateway {
  readonly provider: 'iyzico' | 'paytr' | 'param' | 'stripe';
  createIntent(input: PaymentIntentInput): Promise<PaymentIntent>;
  verifyWebhook(signature: string, body: Buffer): Promise<PaymentWebhookPayload>;
  refund(providerPaymentId: string, amountKurus: Kurus, reason: string): Promise<void>;
}

export class IyzicoGateway implements PaymentGateway {
  readonly provider = 'iyzico' as const;
  constructor(private readonly config: { apiKey: string; secretKey: string; baseUrl: string; subMerchantKey: string }) {}

  async createIntent(_input: PaymentIntentInput): Promise<PaymentIntent> {
    throw new Error('IyzicoGateway.createIntent: not implemented');
  }
  async verifyWebhook(_signature: string, _body: Buffer): Promise<PaymentWebhookPayload> {
    throw new Error('IyzicoGateway.verifyWebhook: not implemented');
  }
  async refund(_providerPaymentId: string, _amountKurus: Kurus, _reason: string): Promise<void> {
    throw new Error('IyzicoGateway.refund: not implemented');
  }
}

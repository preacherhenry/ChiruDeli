export interface PaymentChargeResult {
  status: 'PAID' | 'PENDING' | 'FAILED';
  providerRef?: string;
}

/**
 * Every payment method implements this so checkout doesn't branch on method
 * — swap MobileMoneyProvider's stub for a real MTN/Airtel Money integration
 * later without touching the order-creation flow.
 */
export interface PaymentProvider {
  charge(amount: number, orderId: string): Promise<PaymentChargeResult>;
}

/** The only genuinely-complete path today — no external account required. */
export class CashOnDeliveryProvider implements PaymentProvider {
  async charge(): Promise<PaymentChargeResult> {
    return { status: 'PENDING' }; // becomes PAID when the rider collects cash on delivery
  }
}

/** Records the order as awaiting an external charge; wire up a real gateway later. */
export class MobileMoneyStubProvider implements PaymentProvider {
  async charge(amount: number, orderId: string): Promise<PaymentChargeResult> {
    return { status: 'PENDING', providerRef: `stub-momo-${orderId}` };
  }
}

export class CardStubProvider implements PaymentProvider {
  async charge(amount: number, orderId: string): Promise<PaymentChargeResult> {
    return { status: 'PENDING', providerRef: `stub-card-${orderId}` };
  }
}

export function getPaymentProvider(
  method: 'CASH_ON_DELIVERY' | 'MOBILE_MONEY' | 'CARD',
): PaymentProvider {
  switch (method) {
    case 'CASH_ON_DELIVERY':
      return new CashOnDeliveryProvider();
    case 'MOBILE_MONEY':
      return new MobileMoneyStubProvider();
    case 'CARD':
      return new CardStubProvider();
  }
}

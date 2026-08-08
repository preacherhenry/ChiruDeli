import { prisma } from '../../lib/prisma';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface PromoResolution {
  valid: boolean;
  message: string;
  promotionId?: string;
  type?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_DELIVERY';
  discountAmount?: number;
  freeDelivery?: boolean;
}

export async function resolvePromotion(params: {
  code: string;
  subtotal: number;
  /** Every business touched by the cart — a business-specific promo only
   * applies when that business is actually one of them. */
  businessIds?: string[];
  customerId?: string;
}): Promise<PromoResolution> {
  const promotion = await prisma.promotion.findUnique({ where: { code: params.code.toUpperCase() } });
  const now = new Date();

  if (!promotion || !promotion.isActive) {
    return { valid: false, message: 'This promo code is not valid.' };
  }
  if (promotion.startsAt > now || (promotion.endsAt && promotion.endsAt < now)) {
    return { valid: false, message: 'This promo code has expired.' };
  }
  if (promotion.businessId && !(params.businessIds ?? []).includes(promotion.businessId)) {
    return { valid: false, message: 'This promo code is not valid for these businesses.' };
  }
  if (promotion.minOrderAmount && params.subtotal < Number(promotion.minOrderAmount)) {
    return {
      valid: false,
      message: `This code requires a minimum order of K${Number(promotion.minOrderAmount)}.`,
    };
  }
  if (promotion.usageLimit) {
    const used = await prisma.promotionRedemption.count({ where: { promotionId: promotion.id } });
    if (used >= promotion.usageLimit) {
      return { valid: false, message: 'This promo code has reached its usage limit.' };
    }
  }
  if (promotion.perCustomerLimit && params.customerId) {
    const usedByCustomer = await prisma.promotionRedemption.count({
      where: { promotionId: promotion.id, customerId: params.customerId },
    });
    if (usedByCustomer >= promotion.perCustomerLimit) {
      return { valid: false, message: "You've already used this promo code." };
    }
  }

  if (promotion.type === 'FREE_DELIVERY') {
    return {
      valid: true,
      message: 'Free delivery applied!',
      promotionId: promotion.id,
      type: promotion.type,
      discountAmount: 0,
      freeDelivery: true,
    };
  }

  let discountAmount =
    promotion.type === 'PERCENTAGE'
      ? (params.subtotal * Number(promotion.value)) / 100
      : Number(promotion.value);

  if (promotion.maxDiscountAmount) {
    discountAmount = Math.min(discountAmount, Number(promotion.maxDiscountAmount));
  }
  discountAmount = Math.min(round2(discountAmount), params.subtotal);

  return {
    valid: true,
    message: `You saved K${discountAmount}!`,
    promotionId: promotion.id,
    type: promotion.type,
    discountAmount,
    freeDelivery: false,
  };
}

import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Smartphone, CreditCard, CircleAlert } from 'lucide-react-native';
import { useCreateOrder, ApiError } from '@chirudeli/api-client';
import { useAppNavigation, useAppRoute } from '../../navigation/useAppNavigation';
import { useCartStore } from '../../state/cartStore';
import { Button } from '../../components/Button';
import { formatK } from '../../lib/money';

/**
 * Mobile Money / Card don't have a live gateway wired up yet (see
 * docs/roadmap.md) — MobileMoneyStubProvider/CardStubProvider record the
 * order as PENDING payment on the server. This screen simulates the "wait
 * for the provider" moment so the checkout flow feels real end-to-end; swap
 * in a real provider SDK here later without touching the rest of checkout.
 */
export function PaymentScreen() {
  const navigation = useAppNavigation();
  const { params } = useAppRoute<'Payment'>();
  const { items, clearCart } = useCartStore();
  const createOrder = useCreateOrder();
  const [error, setError] = useState<string | null>(null);
  const Icon = params.paymentMethod === 'MOBILE_MONEY' ? Smartphone : CreditCard;

  useEffect(() => {
    const timer = setTimeout(() => {
      createOrder.mutate(
        {
          idempotencyKey: params.idempotencyKey,
          businessId: params.businessId,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            addOnIds: i.addOnIds,
            specialInstructions: i.specialInstructions,
          })),
          addressId: params.addressId,
          deliveryInstructions: params.deliveryInstructions,
          paymentMethod: params.paymentMethod,
          promoCode: params.promoCode,
        },
        {
          onSuccess: (order) => {
            clearCart();
            navigation.replace('OrderConfirmation', { orderId: order.id });
          },
          onError: (err) => {
            setError(err instanceof ApiError ? err.message : 'Payment could not be completed.');
          },
        },
      );
    }, 1800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-5 px-8">
        {error ? (
          <>
            <View className="h-16 w-16 items-center justify-center rounded-full bg-error/10">
              <CircleAlert size={28} color="#D64545" />
            </View>
            <Text className="text-center font-heading text-lg text-neutral-900">Payment failed</Text>
            <Text className="text-center font-body text-sm text-neutral-500">{error}</Text>
            <Button label="Go back" variant="outline" onPress={() => navigation.goBack()} />
          </>
        ) : (
          <>
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-50">
              <Icon size={28} color="#0E6E4E" />
            </View>
            <ActivityIndicator color="#0E6E4E" />
            <Text className="text-center font-heading text-lg text-neutral-900">
              {params.paymentMethod === 'MOBILE_MONEY' ? 'Confirm on your phone' : 'Processing payment'}
            </Text>
            <Text className="text-center font-body text-sm text-neutral-500">
              {params.paymentMethod === 'MOBILE_MONEY'
                ? `Approve the prompt on your mobile money line for ${formatK(params.total)}.`
                : `Charging your card ${formatK(params.total)}...`}
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

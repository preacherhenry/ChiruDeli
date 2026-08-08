import { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Minus, Plus, Trash2, ShoppingBag, Store } from 'lucide-react-native';
import { usePreviewOrder, useAddresses } from '@chirudeli/api-client';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useCartStore } from '../../state/cartStore';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { formatK } from '../../lib/money';

function storeSubtotal(items: { unitPrice: number; quantity: number }[]) {
  return Math.round(items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) * 100) / 100;
}

export function CartScreen() {
  const navigation = useAppNavigation();
  const { stores, setQuantity, removeItem, subtotal } = useCartStore();
  const addresses = useAddresses();
  const preview = usePreviewOrder();

  const defaultAddress = addresses.data?.find((a) => a.isDefault) ?? addresses.data?.[0];

  // Recompute the accurate multi-store total (real delivery-fee formula,
  // not a client-side guess) any time the cart or address changes.
  const cartKey = useMemo(
    () => JSON.stringify(stores.map((s) => ({ b: s.businessId, items: s.items.map((i) => [i.productId, i.quantity, i.addOnsLabel]) }))),
    [stores],
  );
  useEffect(() => {
    if (stores.length === 0 || !defaultAddress) return;
    preview.mutate({
      items: stores.flatMap((store) =>
        store.items.map((item) => ({
          businessId: store.businessId,
          productId: item.productId,
          quantity: item.quantity,
          addOnIds: item.addOnIds,
          specialInstructions: item.specialInstructions,
        })),
      ),
      addressId: defaultAddress.id,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey, defaultAddress?.id]);

  if (stores.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
        <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <ChevronLeft size={24} color="#1F2328" />
          </Pressable>
          <Text className="font-heading text-xl text-neutral-900">My ChiruDeli Cart</Text>
        </View>
        <EmptyState icon={ShoppingBag} title="Your cart is empty" description="Add items from any business to get started." />
      </SafeAreaView>
    );
  }

  const sub = subtotal();
  const totals = preview.data?.totals;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft size={24} color="#1F2328" />
        </Pressable>
        <Text className="font-heading text-xl text-neutral-900">My ChiruDeli Cart</Text>
      </View>

      <ScrollView className="flex-1 px-4">
        {stores.map((store) => (
          <View key={store.businessId} className="mb-5">
            <View className="mb-2 flex-row items-center gap-2">
              <Store size={15} color="#0E6E4E" />
              <Text className="flex-1 font-heading text-base text-neutral-900">{store.businessName}</Text>
              <Text className="font-body-semibold text-sm text-neutral-700">{formatK(storeSubtotal(store.items))}</Text>
            </View>
            {store.items.map((item) => (
              <View key={`${item.productId}-${item.addOnsLabel ?? ''}`} className="mb-3 flex-row items-start gap-3">
                <View className="flex-1 gap-0.5">
                  <Text className="font-body-semibold text-sm text-neutral-900">{item.name}</Text>
                  {item.addOnsLabel ? <Text className="font-body text-xs text-neutral-500">{item.addOnsLabel}</Text> : null}
                  {item.specialInstructions ? (
                    <Text className="font-body text-xs italic text-neutral-400">"{item.specialInstructions}"</Text>
                  ) : null}
                  <Text className="font-body-semibold text-sm text-primary-700">{formatK(item.unitPrice)}</Text>
                </View>
                <View className="items-end gap-2">
                  <View className="flex-row items-center gap-2">
                    <Pressable
                      onPress={() => setQuantity(store.businessId, item.productId, item.quantity - 1)}
                      className="h-8 w-8 items-center justify-center rounded-full border border-neutral-200"
                    >
                      <Minus size={14} color="#1F2328" />
                    </Pressable>
                    <Text className="w-5 text-center font-body-medium text-sm text-neutral-900">{item.quantity}</Text>
                    <Pressable
                      onPress={() => setQuantity(store.businessId, item.productId, item.quantity + 1)}
                      className="h-8 w-8 items-center justify-center rounded-full bg-primary-600"
                    >
                      <Plus size={14} color="#FFFFFF" />
                    </Pressable>
                  </View>
                  <Pressable onPress={() => removeItem(store.businessId, item.productId)} hitSlop={6}>
                    <Trash2 size={16} color="#D64545" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <View className="gap-2 border-t border-neutral-100 px-4 py-4">
        {preview.isError ? (
          <ErrorState error={preview.error} />
        ) : (
          <>
            <View className="flex-row justify-between">
              <Text className="font-body text-sm text-neutral-500">Subtotal</Text>
              <Text className="font-body text-sm text-neutral-900">{formatK(totals?.subtotal ?? sub)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="font-body text-sm text-neutral-500">
                Delivery{stores.length > 1 ? ` (${stores.length} stores)` : ''}
              </Text>
              {preview.isPending && !totals ? (
                <ActivityIndicator size="small" color="#0E6E4E" />
              ) : (
                <Text className="font-body text-sm text-neutral-900">{formatK(totals?.deliveryFee ?? 0)}</Text>
              )}
            </View>
            <View className="flex-row justify-between">
              <Text className="font-body text-sm text-neutral-500">Service fee</Text>
              <Text className="font-body text-sm text-neutral-900">{formatK(totals?.serviceFee ?? 0)}</Text>
            </View>
            <View className="flex-row justify-between border-t border-neutral-100 pt-2">
              <Text className="font-heading text-base text-neutral-900">Total</Text>
              <Text className="font-heading text-base text-neutral-900">{formatK(totals?.total ?? sub)}</Text>
            </View>
          </>
        )}
        <View className="pt-2">
          <Button
            label="Proceed to Checkout"
            onPress={() => navigation.navigate('Checkout')}
            disabled={!defaultAddress || preview.isError}
          />
          {!defaultAddress ? (
            <Text className="mt-2 text-center font-body text-xs text-neutral-400">Add a delivery address to see accurate totals.</Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

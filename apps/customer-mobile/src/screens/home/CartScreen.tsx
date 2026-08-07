import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react-native';
import { useBusiness } from '@chirudeli/api-client';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useCartStore } from '../../state/cartStore';
import { useLocationStore } from '../../state/locationStore';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { formatK } from '../../lib/money';
import { ESTIMATED_SERVICE_FEE } from '../../lib/constants';

export function CartScreen() {
  const navigation = useAppNavigation();
  const { businessId, businessName, items, setQuantity, removeItem, subtotal } = useCartStore();
  const { coords } = useLocationStore();
  const business = useBusiness(businessId ?? undefined, { lat: coords?.latitude, lng: coords?.longitude });

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
        <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <ChevronLeft size={24} color="#1F2328" />
          </Pressable>
          <Text className="font-heading text-xl text-neutral-900">Your cart</Text>
        </View>
        <EmptyState icon={ShoppingBag} title="Your cart is empty" description="Add items from a business to get started." />
      </SafeAreaView>
    );
  }

  const sub = subtotal();
  const deliveryFee = business.data?.deliveryFee ?? 0;
  const total = sub + deliveryFee + ESTIMATED_SERVICE_FEE;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft size={24} color="#1F2328" />
        </Pressable>
        <Text className="font-heading text-xl text-neutral-900">Your cart</Text>
      </View>
      <Text className="px-4 pb-3 font-body-medium text-sm text-neutral-500">{businessName}</Text>

      <ScrollView className="flex-1 px-4">
        {items.map((item) => (
          <View key={`${item.productId}-${item.addOnsLabel ?? ''}`} className="mb-4 flex-row items-start gap-3">
            <View className="flex-1 gap-0.5">
              <Text className="font-body-semibold text-sm text-neutral-900">{item.name}</Text>
              {item.addOnsLabel ? (
                <Text className="font-body text-xs text-neutral-500">{item.addOnsLabel}</Text>
              ) : null}
              {item.specialInstructions ? (
                <Text className="font-body text-xs italic text-neutral-400">"{item.specialInstructions}"</Text>
              ) : null}
              <Text className="font-body-semibold text-sm text-primary-700">{formatK(item.unitPrice)}</Text>
            </View>
            <View className="items-end gap-2">
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => setQuantity(item.productId, item.quantity - 1)}
                  className="h-8 w-8 items-center justify-center rounded-full border border-neutral-200"
                >
                  <Minus size={14} color="#1F2328" />
                </Pressable>
                <Text className="w-5 text-center font-body-medium text-sm text-neutral-900">{item.quantity}</Text>
                <Pressable
                  onPress={() => setQuantity(item.productId, item.quantity + 1)}
                  className="h-8 w-8 items-center justify-center rounded-full bg-primary-600"
                >
                  <Plus size={14} color="#FFFFFF" />
                </Pressable>
              </View>
              <Pressable onPress={() => removeItem(item.productId)} hitSlop={6}>
                <Trash2 size={16} color="#D64545" />
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="gap-2 border-t border-neutral-100 px-4 py-4">
        <View className="flex-row justify-between">
          <Text className="font-body text-sm text-neutral-500">Subtotal</Text>
          <Text className="font-body text-sm text-neutral-900">{formatK(sub)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="font-body text-sm text-neutral-500">Delivery</Text>
          <Text className="font-body text-sm text-neutral-900">{formatK(deliveryFee)}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="font-body text-sm text-neutral-500">Service fee</Text>
          <Text className="font-body text-sm text-neutral-900">{formatK(ESTIMATED_SERVICE_FEE)}</Text>
        </View>
        <View className="flex-row justify-between border-t border-neutral-100 pt-2">
          <Text className="font-heading text-base text-neutral-900">Total</Text>
          <Text className="font-heading text-base text-neutral-900">{formatK(total)}</Text>
        </View>
        <View className="pt-2">
          <Button label="Proceed to Checkout" onPress={() => navigation.navigate('Checkout')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

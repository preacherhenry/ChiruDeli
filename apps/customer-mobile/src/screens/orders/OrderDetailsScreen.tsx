import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useOrder, useCancelOrder, useSubmitReview, useProducts } from '@chirudeli/api-client';
import { useAppNavigation, useAppRoute } from '../../navigation/useAppNavigation';
import { useCartStore } from '../../state/cartStore';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../components/LoadingState';
import { StarRatingInput } from '../../components/StarRatingInput';
import { formatK } from '../../lib/money';

const ACTIVE_STATUSES = ['PENDING_CONFIRMATION', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP', 'ON_THE_WAY'];
const CANCELLABLE_STATUSES = ['PENDING_CONFIRMATION', 'CONFIRMED'];

export function OrderDetailsScreen() {
  const navigation = useAppNavigation();
  const { params } = useAppRoute<'OrderDetails'>();
  const order = useOrder(params.orderId);
  const cancelOrder = useCancelOrder();
  const submitReview = useSubmitReview();
  const addItem = useCartStore((s) => s.addItem);
  const replaceCart = useCartStore((s) => s.replaceCart);
  const products = useProducts(order.data?.businessId);

  const [businessRating, setBusinessRating] = useState(0);
  const [riderRating, setRiderRating] = useState(0);
  const [comment, setComment] = useState('');

  if (order.isLoading || !order.data) return <LoadingState />;
  const o = order.data;

  const onOrderAgain = () => {
    if (!products.data) return;
    let addedCount = 0;
    for (const item of o.items) {
      const product = products.data.find((p) => p.id === item.productId);
      if (!product || !product.isAvailable) continue;
      const cartItem = {
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        imageUrl: product.imageUrl,
        quantity: item.quantity,
        addOnIds: [],
        specialInstructions: item.specialInstructions,
      };
      if (addedCount === 0) replaceCart(o.businessId, o.businessName, cartItem);
      else addItem(o.businessId, o.businessName, cartItem);
      addedCount++;
    }
    if (addedCount === 0) {
      Alert.alert('Unavailable', 'None of these items are available right now.');
      return;
    }
    navigation.navigate('Cart');
  };

  const onCancel = () => {
    Alert.alert('Cancel this order?', 'This cannot be undone.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: () => cancelOrder.mutate({ id: o.id, input: { reason: 'Customer cancelled from app' } }),
      },
    ]);
  };

  const onSubmitReview = () => {
    if (businessRating === 0) {
      Alert.alert('Rating required', 'Please rate the business first.');
      return;
    }
    submitReview.mutate({
      id: o.id,
      input: {
        businessRating,
        businessComment: comment || undefined,
        riderRating: o.rider ? riderRating || undefined : undefined,
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft size={24} color="#1F2328" />
        </Pressable>
        <Text className="flex-1 font-heading text-lg text-neutral-900">Order #{o.orderNumber}</Text>
        <StatusBadge status={o.status} />
      </View>

      <ScrollView className="flex-1 px-4">
        <Text className="mb-2 font-heading text-base text-neutral-900">{o.businessName}</Text>
        <View className="mb-4 gap-2 rounded-lg bg-white p-4">
          {o.items.map((item) => (
            <View key={item.id} className="flex-row justify-between">
              <Text className="flex-1 font-body text-sm text-neutral-800">
                {item.nameSnapshot} × {item.quantity}
              </Text>
              <Text className="font-body text-sm text-neutral-900">{formatK(item.lineTotal)}</Text>
            </View>
          ))}
          <View className="mt-1 gap-1 border-t border-neutral-100 pt-2">
            <View className="flex-row justify-between">
              <Text className="font-body text-xs text-neutral-500">Subtotal</Text>
              <Text className="font-body text-xs text-neutral-700">{formatK(o.totals.subtotal)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="font-body text-xs text-neutral-500">Delivery</Text>
              <Text className="font-body text-xs text-neutral-700">{formatK(o.totals.deliveryFee)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="font-body text-xs text-neutral-500">Service fee</Text>
              <Text className="font-body text-xs text-neutral-700">{formatK(o.totals.serviceFee)}</Text>
            </View>
            {o.totals.discount > 0 ? (
              <View className="flex-row justify-between">
                <Text className="font-body text-xs text-primary-700">Discount</Text>
                <Text className="font-body text-xs text-primary-700">-{formatK(o.totals.discount)}</Text>
              </View>
            ) : null}
            <View className="flex-row justify-between pt-1">
              <Text className="font-heading text-sm text-neutral-900">Total</Text>
              <Text className="font-heading text-sm text-neutral-900">{formatK(o.totals.total)}</Text>
            </View>
          </View>
        </View>

        {o.status === 'DELIVERED' && !o.hasReview ? (
          <View className="mb-6 gap-3 rounded-lg bg-white p-4">
            <Text className="font-heading text-base text-neutral-900">Rate your order</Text>
            <View className="gap-1">
              <Text className="font-body text-sm text-neutral-600">{o.businessName}</Text>
              <StarRatingInput value={businessRating} onChange={setBusinessRating} />
            </View>
            {o.rider ? (
              <View className="gap-1">
                <Text className="font-body text-sm text-neutral-600">{o.rider.fullName} (rider)</Text>
                <StarRatingInput value={riderRating} onChange={setRiderRating} />
              </View>
            ) : null}
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Leave a comment (optional)"
              multiline
              className="min-h-[60px] rounded-lg border border-neutral-200 p-3 font-body text-sm text-neutral-900"
            />
            <Button label="Submit review" onPress={onSubmitReview} loading={submitReview.isPending} />
          </View>
        ) : o.hasReview ? (
          <Text className="mb-6 font-body text-sm text-neutral-400">Thanks — you already reviewed this order.</Text>
        ) : null}
      </ScrollView>

      <View className="gap-2 border-t border-neutral-100 px-4 py-3">
        {ACTIVE_STATUSES.includes(o.status) ? (
          <Button label="Track order" onPress={() => navigation.navigate('LiveTracking', { orderId: o.id })} />
        ) : (
          <Button label="Order Again" onPress={onOrderAgain} />
        )}
        {CANCELLABLE_STATUSES.includes(o.status) ? (
          <Button label="Cancel order" variant="ghost" onPress={onCancel} loading={cancelOrder.isPending} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

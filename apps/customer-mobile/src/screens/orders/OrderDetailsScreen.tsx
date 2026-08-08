import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Store } from 'lucide-react-native';
import { useOrder, useCancelOrder, useSubmitReview, useSubmitRiderReview, useApiClient } from '@chirudeli/api-client';
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
  const submitRiderReview = useSubmitRiderReview();
  const addItem = useCartStore((s) => s.addItem);
  const apiClient = useApiClient();

  const [businessRatings, setBusinessRatings] = useState<Record<string, number>>({});
  const [businessComments, setBusinessComments] = useState<Record<string, string>>({});
  const [riderRating, setRiderRating] = useState(0);
  const [riderComment, setRiderComment] = useState('');
  const [reordering, setReordering] = useState(false);

  if (order.isLoading || !order.data) return <LoadingState />;
  const o = order.data;

  const onOrderAgain = async () => {
    setReordering(true);
    let addedCount = 0;
    try {
      for (const storeOrder of o.storeOrders) {
        const products = await apiClient.businesses.products(storeOrder.businessId);
        for (const item of storeOrder.items) {
          const product = products.find((p) => p.id === item.productId);
          if (!product || !product.isAvailable) continue;
          addItem(storeOrder.businessId, storeOrder.businessName, {
            productId: product.id,
            name: product.name,
            unitPrice: product.price,
            imageUrl: product.imageUrl,
            quantity: item.quantity,
            addOnIds: [],
            specialInstructions: item.specialInstructions,
          });
          addedCount++;
        }
      }
    } finally {
      setReordering(false);
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

  const onSubmitStoreReview = (storeOrderId: string) => {
    const rating = businessRatings[storeOrderId] ?? 0;
    if (rating === 0) {
      Alert.alert('Rating required', 'Please rate this business first.');
      return;
    }
    submitReview.mutate({
      id: storeOrderId,
      input: { businessRating: rating, businessComment: businessComments[storeOrderId] || undefined },
    });
  };

  const onSubmitRiderReview = () => {
    if (riderRating === 0) {
      Alert.alert('Rating required', 'Please rate the rider first.');
      return;
    }
    submitRiderReview.mutate({ id: o.id, input: { riderRating, riderComment: riderComment || undefined } });
  };

  const pendingStoreReviews = o.storeOrders.filter((so) => so.status === 'DELIVERED' && !so.hasReview);
  const canReviewRider = o.status === 'DELIVERED' && o.rider && o.riderRating == null;

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
        {o.storeOrders.map((storeOrder) => (
          <View key={storeOrder.id} className="mb-4 gap-2 rounded-lg bg-white p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Store size={15} color="#0E6E4E" />
                <Text className="font-heading text-base text-neutral-900">{storeOrder.businessName}</Text>
              </View>
              <StatusBadge status={storeOrder.status} />
            </View>
            {storeOrder.items.map((item) => (
              <View key={item.id} className="flex-row justify-between">
                <Text className="flex-1 font-body text-sm text-neutral-800">
                  {item.nameSnapshot} × {item.quantity}
                </Text>
                <Text className="font-body text-sm text-neutral-900">{formatK(item.lineTotal)}</Text>
              </View>
            ))}
            <View className="flex-row justify-between border-t border-neutral-100 pt-2">
              <Text className="font-body-semibold text-xs text-neutral-500">Store subtotal</Text>
              <Text className="font-body-semibold text-xs text-neutral-700">{formatK(storeOrder.subtotal)}</Text>
            </View>
          </View>
        ))}

        <View className="mb-4 gap-1 rounded-lg bg-white p-4">
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

        {pendingStoreReviews.length > 0 ? (
          <View className="mb-4 gap-4 rounded-lg bg-white p-4">
            <Text className="font-heading text-base text-neutral-900">Rate your order</Text>
            {pendingStoreReviews.map((storeOrder) => (
              <View key={storeOrder.id} className="gap-2 border-t border-neutral-100 pt-3 first:border-t-0 first:pt-0">
                <Text className="font-body text-sm text-neutral-600">{storeOrder.businessName}</Text>
                <StarRatingInput
                  value={businessRatings[storeOrder.id] ?? 0}
                  onChange={(v) => setBusinessRatings((s) => ({ ...s, [storeOrder.id]: v }))}
                />
                <TextInput
                  value={businessComments[storeOrder.id] ?? ''}
                  onChangeText={(v) => setBusinessComments((s) => ({ ...s, [storeOrder.id]: v }))}
                  placeholder="Leave a comment (optional)"
                  multiline
                  className="min-h-[50px] rounded-lg border border-neutral-200 p-3 font-body text-sm text-neutral-900"
                />
                <Button label="Submit review" onPress={() => onSubmitStoreReview(storeOrder.id)} loading={submitReview.isPending} />
              </View>
            ))}
          </View>
        ) : null}

        {canReviewRider ? (
          <View className="mb-6 gap-3 rounded-lg bg-white p-4">
            <Text className="font-heading text-base text-neutral-900">Rate your rider</Text>
            <Text className="font-body text-sm text-neutral-600">{o.rider?.fullName}</Text>
            <StarRatingInput value={riderRating} onChange={setRiderRating} />
            <TextInput
              value={riderComment}
              onChangeText={setRiderComment}
              placeholder="Leave a comment (optional)"
              multiline
              className="min-h-[60px] rounded-lg border border-neutral-200 p-3 font-body text-sm text-neutral-900"
            />
            <Button label="Submit review" onPress={onSubmitRiderReview} loading={submitRiderReview.isPending} />
          </View>
        ) : null}
      </ScrollView>

      <View className="gap-2 border-t border-neutral-100 px-4 py-3">
        {ACTIVE_STATUSES.includes(o.status) ? (
          <Button label="Track order" onPress={() => navigation.navigate('LiveTracking', { orderId: o.id })} />
        ) : (
          <Button label="Order Again" onPress={onOrderAgain} loading={reordering} />
        )}
        {CANCELLABLE_STATUSES.includes(o.status) ? (
          <Button label="Cancel order" variant="ghost" onPress={onCancel} loading={cancelOrder.isPending} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

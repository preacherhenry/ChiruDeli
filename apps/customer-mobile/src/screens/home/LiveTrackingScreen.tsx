import { useEffect, useState } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Phone, MessageCircle, Star } from 'lucide-react-native';
import { useOrder, subscribeToOrderTracking, useApiClient } from '@chirudeli/api-client';
import type { OrderStatus, Coordinates } from '@chirudeli/shared-types';
import { useAppNavigation, useAppRoute } from '../../navigation/useAppNavigation';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { WS_URL, GOOGLE_MAPS_API_KEY } from '../../lib/apiClient';
import { TrackingMap } from '../../components/TrackingMap';

const TIMELINE: OrderStatus[] = [
  'CONFIRMED',
  'PREPARING',
  'RIDER_ASSIGNED',
  'PICKED_UP',
  'ON_THE_WAY',
  'DELIVERED',
];

const TIMELINE_LABELS: Record<OrderStatus, string> = {
  PENDING_CONFIRMATION: 'Order Placed',
  CONFIRMED: 'Order Confirmed',
  PREPARING: 'Business Preparing Order',
  READY_FOR_PICKUP: 'Ready for Pickup',
  RIDER_ASSIGNED: 'Rider Assigned',
  PICKED_UP: 'Rider Picking Up Order',
  ON_THE_WAY: 'Rider On The Way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export function LiveTrackingScreen() {
  const navigation = useAppNavigation();
  const { params } = useAppRoute<'LiveTracking'>();
  const order = useOrder(params.orderId);
  const apiClient = useApiClient();

  const [liveStatus, setLiveStatus] = useState<OrderStatus | null>(null);
  const [riderLocation, setRiderLocation] = useState<Coordinates | null>(null);
  const [eta, setEta] = useState<number | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    apiClient.getAccessToken().then((token) => {
      if (!token) return;
      const { close } = subscribeToOrderTracking(WS_URL, params.orderId, token, {
        onStatusChanged: (event) => {
          setLiveStatus(event.status);
          setEta(event.estimatedArrivalMinutes);
          if (event.rider?.location) setRiderLocation(event.rider.location);
        },
        onLocationUpdated: (event) => setRiderLocation(event.location),
      });
      cleanup = close;
    });
    return () => cleanup?.();
  }, [apiClient, params.orderId]);

  if (order.isLoading || !order.data) return <LoadingState label="Loading your order..." />;

  const status = liveStatus ?? order.data.status;
  const rider = order.data.rider;
  const currentIndex = TIMELINE.indexOf(status);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft size={24} color="#1F2328" />
        </Pressable>
        <View className="flex-1">
          <Text className="font-heading text-lg text-neutral-900">Order #{order.data.orderNumber}</Text>
          <Text className="font-body text-xs text-neutral-500">{order.data.businessName}</Text>
        </View>
        <StatusBadge status={status} />
      </View>

      {GOOGLE_MAPS_API_KEY ? (
        <TrackingMap
          business={order.data.businessLocation}
          customer={order.data.address}
          rider={riderLocation}
        />
      ) : null}

      <View className="px-4 pt-4">
        {eta != null && status !== 'DELIVERED' && status !== 'CANCELLED' ? (
          <Text className="mb-4 font-heading text-base text-neutral-900">
            Arriving in ~{eta} min
          </Text>
        ) : null}

        {status === 'CANCELLED' ? (
          <Text className="font-body text-sm text-error">This order was cancelled.</Text>
        ) : (
          <View className="gap-4">
            {TIMELINE.map((step, index) => {
              const done = currentIndex >= index;
              return (
                <View key={step} className="flex-row items-center gap-3">
                  <View
                    className={`h-3 w-3 rounded-full ${done ? 'bg-primary-600' : 'bg-neutral-200'}`}
                  />
                  <Text className={`font-body text-sm ${done ? 'text-neutral-900' : 'text-neutral-400'}`}>
                    {TIMELINE_LABELS[step]}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {rider ? (
          <View className="mt-6 flex-row items-center gap-3 rounded-lg bg-white p-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-50">
              <Text className="font-heading text-lg text-primary-700">{rider.fullName.charAt(0)}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-body-semibold text-sm text-neutral-900">{rider.fullName}</Text>
              <Text className="font-body text-xs text-neutral-500">{rider.vehicleType}</Text>
              <View className="mt-0.5 flex-row items-center gap-1">
                <Star size={12} color="#DB8B1A" fill="#DB8B1A" />
                <Text className="font-body text-xs text-neutral-500">{rider.ratingAvg.toFixed(1)}</Text>
              </View>
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => rider.phone && Linking.openURL(`tel:${rider.phone}`)}
                className="h-10 w-10 items-center justify-center rounded-full bg-primary-600"
              >
                <Phone size={16} color="#FFFFFF" />
              </Pressable>
              <Pressable
                onPress={() => rider.phone && Linking.openURL(`sms:${rider.phone}`)}
                className="h-10 w-10 items-center justify-center rounded-full bg-secondary-500"
              >
                <MessageCircle size={16} color="#1F2328" />
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

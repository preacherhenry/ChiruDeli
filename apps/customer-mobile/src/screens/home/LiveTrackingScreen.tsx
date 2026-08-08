import { useEffect, useState } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Phone, MessageCircle, Star, Store, Home, Check } from 'lucide-react-native';
import { useOrder, subscribeToOrderTracking, useApiClient } from '@chirudeli/api-client';
import type { OrderStatus, Coordinates, DeliveryStop } from '@chirudeli/shared-types';
import { useAppNavigation, useAppRoute } from '../../navigation/useAppNavigation';
import { LoadingState } from '../../components/LoadingState';
import { StatusBadge } from '../../components/StatusBadge';
import { WS_URL, GOOGLE_MAPS_API_KEY } from '../../lib/apiClient';
import { TrackingMap } from '../../components/TrackingMap';

export function LiveTrackingScreen() {
  const navigation = useAppNavigation();
  const { params } = useAppRoute<'LiveTracking'>();
  const order = useOrder(params.orderId);
  const apiClient = useApiClient();

  const [liveStatus, setLiveStatus] = useState<OrderStatus | null>(null);
  const [liveStops, setLiveStops] = useState<DeliveryStop[] | null>(null);
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
          setLiveStops(event.deliveryStops);
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
  const stops = [...(liveStops ?? order.data.deliveryStops)].sort((a, b) => a.sequence - b.sequence);
  const pickupStops = stops.filter((s) => s.type === 'PICKUP');
  const dropoffStop = stops.find((s) => s.type === 'DROPOFF');

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft size={24} color="#1F2328" />
        </Pressable>
        <View className="flex-1">
          <Text className="font-heading text-lg text-neutral-900">Order #{order.data.orderNumber}</Text>
          <Text className="font-body text-xs text-neutral-500">
            {order.data.storeOrders.map((s) => s.businessName).join(', ')}
          </Text>
        </View>
        <StatusBadge status={status} />
      </View>

      {GOOGLE_MAPS_API_KEY && dropoffStop ? (
        <TrackingMap
          pickups={pickupStops.map((s) => ({ location: s.location, label: s.label, completed: s.status === 'COMPLETED' }))}
          dropoff={dropoffStop.location}
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
        ) : rider ? (
          <View className="gap-4">
            {stops.map((stop) => {
              const done = stop.status === 'COMPLETED';
              const active = stop.status === 'ARRIVED';
              const Icon = stop.type === 'PICKUP' ? Store : Home;
              return (
                <View key={stop.id} className="flex-row items-center gap-3">
                  <View
                    className={`h-7 w-7 items-center justify-center rounded-full ${done ? 'bg-primary-600' : active ? 'bg-secondary-500' : 'bg-neutral-200'}`}
                  >
                    {done ? <Check size={14} color="#FFFFFF" /> : <Icon size={14} color={active ? '#1F2328' : '#767B72'} />}
                  </View>
                  <Text className={`font-body text-sm ${done || active ? 'text-neutral-900' : 'text-neutral-400'}`}>
                    {stop.type === 'PICKUP' ? `Pickup: ${stop.label}` : `Deliver to ${stop.label}`}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text className="font-body text-sm text-neutral-500">
            Waiting for a rider to be assigned — your route will appear here once one accepts.
          </Text>
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

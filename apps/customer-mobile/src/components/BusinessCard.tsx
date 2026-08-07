import { Pressable, View, Text, Image } from 'react-native';
import { Star, Clock } from 'lucide-react-native';
import type { BusinessSummary } from '@chirudeli/shared-types';
import { formatK } from '../lib/money';

export function BusinessCard({ business, onPress }: { business: BusinessSummary; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-4 overflow-hidden rounded-xl bg-white active:opacity-90"
      style={{ shadowColor: '#1F2328', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
    >
      <View className="h-28 w-full bg-neutral-100">
        {business.logoUrl ? (
          <Image source={{ uri: business.logoUrl }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Text className="font-heading text-2xl text-neutral-300">{business.name.charAt(0)}</Text>
          </View>
        )}
        {!business.isOpenNow ? (
          <View className="absolute inset-0 items-center justify-center bg-neutral-900/50">
            <Text className="font-body-semibold text-xs text-white">Closed</Text>
          </View>
        ) : null}
      </View>
      <View className="gap-1 p-3">
        <Text className="font-body-semibold text-base text-neutral-900" numberOfLines={1}>
          {business.name}
        </Text>
        <Text className="font-body text-xs text-neutral-500">{business.category.name}</Text>
        <View className="mt-1 flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Star size={13} color="#DB8B1A" fill="#DB8B1A" />
            <Text className="font-body text-xs text-neutral-600">
              {business.ratingAvg.toFixed(1)} ({business.ratingCount})
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Clock size={13} color="#767B72" />
            <Text className="font-body text-xs text-neutral-600">{business.estimatedDeliveryMinutes} min</Text>
          </View>
          <Text className="font-body text-xs text-neutral-600">{formatK(business.deliveryFee)} delivery</Text>
        </View>
      </View>
    </Pressable>
  );
}

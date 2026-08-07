import { Pressable, View, Text, Image } from 'react-native';
import { Plus } from 'lucide-react-native';
import type { Product } from '@chirudeli/shared-types';
import { formatK } from '../lib/money';

export function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!product.isAvailable}
      className={`mb-3 flex-row items-center gap-3 rounded-lg bg-white p-3 active:opacity-90 ${!product.isAvailable ? 'opacity-50' : ''}`}
      style={{ shadowColor: '#1F2328', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 }}
    >
      <View className="h-16 w-16 overflow-hidden rounded-md bg-neutral-100">
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} className="h-full w-full" resizeMode="cover" />
        ) : null}
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-body-semibold text-sm text-neutral-900" numberOfLines={1}>
          {product.name}
        </Text>
        {product.description ? (
          <Text className="font-body text-xs text-neutral-500" numberOfLines={2}>
            {product.description}
          </Text>
        ) : null}
        <Text className="font-body-semibold text-sm text-primary-700">{formatK(product.price)}</Text>
        {!product.isAvailable ? (
          <Text className="font-body text-xs text-error">Currently unavailable</Text>
        ) : null}
      </View>
      {product.isAvailable ? (
        <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-600">
          <Plus size={18} color="#FFFFFF" />
        </View>
      ) : null}
    </Pressable>
  );
}

import { useMemo } from 'react';
import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Star, Clock, Truck, Heart } from 'lucide-react-native';
import { useBusiness, useProducts } from '@chirudeli/api-client';
import { useAppNavigation, useAppRoute } from '../../navigation/useAppNavigation';
import { useLocationStore } from '../../state/locationStore';
import { useFavoritesStore } from '../../state/favoritesStore';
import { ProductCard } from '../../components/ProductCard';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { formatK } from '../../lib/money';

export function BusinessDetailsScreen() {
  const navigation = useAppNavigation();
  const { params } = useAppRoute<'BusinessDetails'>();
  const { coords } = useLocationStore();
  const business = useBusiness(params.businessId, { lat: coords?.latitude, lng: coords?.longitude });
  const products = useProducts(params.businessId);
  const isFavorite = useFavoritesStore((s) => s.isFavorite(params.businessId));
  const toggleFavorite = useFavoritesStore((s) => s.toggleBusiness);

  const grouped = useMemo(() => {
    if (!products.data) return [];
    const map = new Map<string, { name: string; items: typeof products.data }>();
    for (const product of products.data) {
      const entry = map.get(product.categoryId);
      if (entry) entry.items.push(product);
      else map.set(product.categoryId, { name: product.categoryName, items: [product] });
    }
    return Array.from(map.values());
  }, [products.data]);

  if (business.isLoading) return <LoadingState />;
  if (business.isError || !business.data) return <ErrorState error={business.error} onRetry={() => business.refetch()} />;

  const b = business.data;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="h-40 w-full bg-neutral-100">
          {b.coverImageUrl ? (
            <Image source={{ uri: b.coverImageUrl }} className="h-full w-full" resizeMode="cover" />
          ) : null}
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            className="absolute left-4 top-4 h-9 w-9 items-center justify-center rounded-full bg-white/90"
          >
            <ChevronLeft size={22} color="#1F2328" />
          </Pressable>
          <Pressable
            onPress={() => toggleFavorite(params.businessId)}
            hitSlop={8}
            className="absolute right-4 top-4 h-9 w-9 items-center justify-center rounded-full bg-white/90"
          >
            <Heart size={20} color="#D64545" fill={isFavorite ? '#D64545' : 'transparent'} />
          </Pressable>
        </View>

        <View className="gap-2 px-4 pt-4">
          <Text className="font-heading text-2xl text-neutral-900">{b.name}</Text>
          <Text className="font-body text-sm text-neutral-500">{b.description}</Text>
          <View className="flex-row flex-wrap items-center gap-4 pt-1">
            <View className="flex-row items-center gap-1">
              <Star size={14} color="#DB8B1A" fill="#DB8B1A" />
              <Text className="font-body text-sm text-neutral-600">
                {b.ratingAvg.toFixed(1)} ({b.ratingCount} reviews)
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Clock size={14} color="#767B72" />
              <Text className="font-body text-sm text-neutral-600">{b.estimatedDeliveryMinutes} min</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Truck size={14} color="#767B72" />
              <Text className="font-body text-sm text-neutral-600">{formatK(b.deliveryFee)} delivery</Text>
            </View>
          </View>
          {!b.isOpenNow ? (
            <View className="self-start rounded-pill bg-error/10 px-3 py-1">
              <Text className="font-body-semibold text-xs text-error">Currently closed</Text>
            </View>
          ) : null}
        </View>

        <View className="px-4 pt-5">
          {products.isLoading ? (
            <LoadingState />
          ) : (
            grouped.map((group) => (
              <View key={group.name} className="mb-5">
                <Text className="mb-3 font-heading text-base text-neutral-900">{group.name}</Text>
                {group.items.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onPress={() =>
                      navigation.navigate('ProductDetails', { businessId: b.id, productId: product.id })
                    }
                  />
                ))}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

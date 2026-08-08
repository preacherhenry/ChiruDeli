import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Store } from 'lucide-react-native';
import { useBusinesses, useStoreClasses } from '@chirudeli/api-client';
import { useAppNavigation, useAppRoute } from '../../navigation/useAppNavigation';
import { useLocationStore } from '../../state/locationStore';
import { BusinessCard } from '../../components/BusinessCard';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';

export function BusinessListingScreen() {
  const navigation = useAppNavigation();
  const route = useAppRoute<'BusinessListing'>();
  const { coords } = useLocationStore();
  const storeClasses = useStoreClasses();
  const category = storeClasses.data?.find((c) => c.slug === route.params?.categorySlug);

  const businesses = useBusinesses({
    category: route.params?.categorySlug,
    search: route.params?.searchQuery,
    lat: coords?.latitude,
    lng: coords?.longitude,
  });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft size={24} color="#1F2328" />
        </Pressable>
        <Text className="font-heading text-xl text-neutral-900">{category?.name ?? 'All businesses'}</Text>
      </View>

      {businesses.isLoading ? (
        <LoadingState />
      ) : businesses.isError ? (
        <ErrorState error={businesses.error} onRetry={() => businesses.refetch()} />
      ) : (
        <FlatList
          data={businesses.data ?? []}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <BusinessCard business={item} onPress={() => navigation.navigate('BusinessDetails', { businessId: item.id })} />
          )}
          ListEmptyComponent={
            <EmptyState icon={Store} title="Nothing here yet" description="Check back soon as more businesses join ChiruDeli." />
          }
        />
      )}
    </SafeAreaView>
  );
}

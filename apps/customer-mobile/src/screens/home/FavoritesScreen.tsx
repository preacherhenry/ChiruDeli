import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart } from 'lucide-react-native';
import { useBusinesses } from '@chirudeli/api-client';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useFavoritesStore } from '../../state/favoritesStore';
import { useLocationStore } from '../../state/locationStore';
import { BusinessCard } from '../../components/BusinessCard';
import { LoadingState } from '../../components/LoadingState';
import { EmptyState } from '../../components/EmptyState';

export function FavoritesScreen() {
  const navigation = useAppNavigation();
  const { coords } = useLocationStore();
  const businessIds = useFavoritesStore((s) => s.businessIds);
  const businesses = useBusinesses({ lat: coords?.latitude, lng: coords?.longitude });
  const favorites = (businesses.data ?? []).filter((b) => businessIds.includes(b.id));

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="px-4 pb-3 pt-3">
        <Text className="font-heading text-xl text-neutral-900">Favorites</Text>
      </View>
      {businesses.isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <BusinessCard business={item} onPress={() => navigation.navigate('BusinessDetails', { businessId: item.id })} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={Heart}
              title="No favorites yet"
              description="Tap the heart on a business page to save it here."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

import { useState } from 'react';
import { View, Text, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon, SearchX } from 'lucide-react-native';
import { useBusinesses } from '@chirudeli/api-client';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useLocationStore } from '../../state/locationStore';
import { BusinessCard } from '../../components/BusinessCard';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';

export function SearchScreen() {
  const navigation = useAppNavigation();
  const [query, setQuery] = useState('');
  const { coords } = useLocationStore();
  const results = useBusinesses({ search: query || undefined, lat: coords?.latitude, lng: coords?.longitude });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="px-4 pb-3 pt-3">
        <Text className="mb-3 font-heading text-xl text-neutral-900">Search</Text>
        <View className="flex-row items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3">
          <SearchIcon size={18} color="#767B72" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Restaurants, groceries, medicines..."
            className="flex-1 font-body text-base text-neutral-900"
            autoFocus
          />
        </View>
      </View>

      {!query ? (
        <EmptyState
          icon={SearchIcon}
          title="Search ChiruDeli"
          description="Find restaurants, shops, groceries, medicines, electronics and more."
        />
      ) : results.isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={results.data ?? []}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <BusinessCard business={item} onPress={() => navigation.navigate('BusinessDetails', { businessId: item.id })} />
          )}
          ListEmptyComponent={
            <EmptyState icon={SearchX} title="No results" description={`Nothing matched "${query}" yet.`} />
          }
        />
      )}
    </SafeAreaView>
  );
}

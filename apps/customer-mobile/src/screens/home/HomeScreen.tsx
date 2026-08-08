import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, ChevronDown, Search as SearchIcon, User, Store } from 'lucide-react-native';
import { useBusinesses, useStoreClasses } from '@chirudeli/api-client';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useLocationStore } from '../../state/locationStore';
import { CategoryCard } from '../../components/CategoryCard';
import { BusinessCard } from '../../components/BusinessCard';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';

export function HomeScreen() {
  const navigation = useAppNavigation();
  const { coords, label } = useLocationStore();
  const businesses = useBusinesses({ lat: coords?.latitude, lng: coords?.longitude });
  const storeClasses = useStoreClasses();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center justify-between px-4 pb-2 pt-3">
        <Pressable className="flex-1 flex-row items-center gap-1">
          <Text className="font-body text-xs text-neutral-500">Deliver to</Text>
        </Pressable>
        <View className="flex-row items-center gap-4">
          <Pressable onPress={() => navigation.navigate('Notifications')}>
            <Bell size={22} color="#1F2328" />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Profile')}>
            <View className="h-8 w-8 items-center justify-center rounded-full bg-primary-50">
              <User size={16} color="#0E6E4E" />
            </View>
          </Pressable>
        </View>
      </View>
      <Pressable className="mx-4 mb-3 flex-row items-center gap-1">
        <Text className="font-heading text-base text-neutral-900">{label}</Text>
        <ChevronDown size={16} color="#1F2328" />
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={() => navigation.navigate('BusinessListing', {})}
          className="mx-4 mb-5 flex-row items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3"
        >
          <SearchIcon size={18} color="#767B72" />
          <Text className="font-body text-sm text-neutral-400">What are you looking for?</Text>
        </Pressable>

        <View className="mb-6 flex-row flex-wrap justify-between gap-y-4 px-4">
          {(storeClasses.data ?? []).map((c) => (
            <CategoryCard
              key={c.id}
              icon={c.icon}
              name={c.name}
              onPress={() => navigation.navigate('BusinessListing', { categorySlug: c.slug })}
            />
          ))}
        </View>

        <View className="px-4 pb-8">
          <Text className="mb-3 font-heading text-lg text-neutral-900">Popular near you</Text>
          {businesses.isLoading ? (
            <LoadingState label="Finding businesses near you..." />
          ) : businesses.isError ? (
            <ErrorState error={businesses.error} onRetry={() => businesses.refetch()} />
          ) : businesses.data && businesses.data.length > 0 ? (
            businesses.data.map((b) => (
              <BusinessCard
                key={b.id}
                business={b}
                onPress={() => navigation.navigate('BusinessDetails', { businessId: b.id })}
              />
            ))
          ) : (
            <EmptyState
              icon={Store}
              title="No businesses yet"
              description="We're onboarding businesses in your area — check back soon."
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

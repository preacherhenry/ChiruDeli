import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { CategoryCard } from '../../components/CategoryCard';
import { CATEGORIES } from '../../lib/categories';

export function CategoriesScreen() {
  const navigation = useAppNavigation();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="px-4 pb-3 pt-3">
        <Text className="font-heading text-xl text-neutral-900">Browse categories</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="flex-row flex-wrap justify-between gap-y-6">
          {CATEGORIES.map((c) => (
            <CategoryCard
              key={c.slug}
              slug={c.slug}
              name={c.name}
              onPress={() => navigation.navigate('BusinessListing', { categorySlug: c.slug })}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

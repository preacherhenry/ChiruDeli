import { Pressable, View, Text } from 'react-native';
import type { BusinessCategorySlug } from '@chirudeli/shared-types';
import { CATEGORY_ICONS } from '../lib/categoryIcons';

export function CategoryCard({
  slug,
  name,
  onPress,
}: {
  slug: BusinessCategorySlug;
  name: string;
  onPress: () => void;
}) {
  const Icon = CATEGORY_ICONS[slug];
  return (
    <Pressable onPress={onPress} className="w-[23%] items-center gap-1.5 active:opacity-80">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-50">
        <Icon size={22} color="#0E6E4E" />
      </View>
      <Text className="text-center font-body text-xs text-neutral-700" numberOfLines={1}>
        {name}
      </Text>
    </Pressable>
  );
}

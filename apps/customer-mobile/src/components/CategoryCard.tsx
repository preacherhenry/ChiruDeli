import { Pressable, View, Text } from 'react-native';

export function CategoryCard({
  icon,
  name,
  onPress,
}: {
  icon: string | null;
  name: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="w-[23%] items-center gap-1.5 active:opacity-80">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-50">
        <Text style={{ fontSize: 22 }}>{icon ?? '🏬'}</Text>
      </View>
      <Text className="text-center font-body text-xs text-neutral-700" numberOfLines={1}>
        {name}
      </Text>
    </Pressable>
  );
}

import { View, Pressable } from 'react-native';
import { Star } from 'lucide-react-native';

export function StarRatingInput({
  value,
  onChange,
  size = 26,
}: {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
}) {
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange(star)} hitSlop={4}>
          <Star size={size} color="#DB8B1A" fill={star <= value ? '#DB8B1A' : 'transparent'} />
        </Pressable>
      ))}
    </View>
  );
}

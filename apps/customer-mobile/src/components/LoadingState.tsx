import { View, ActivityIndicator, Text } from 'react-native';

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 py-16">
      <ActivityIndicator color="#0E6E4E" size="large" />
      <Text className="font-body text-neutral-500">{label}</Text>
    </View>
  );
}

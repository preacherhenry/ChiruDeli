import { View, Text } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

export function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <View className="flex-1 gap-2 rounded-lg bg-white p-4">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-50">
        <Icon size={16} color="#0E6E4E" />
      </View>
      <Text className="font-heading text-xl text-neutral-900">{value}</Text>
      <Text className="font-body text-xs text-neutral-500">{label}</Text>
    </View>
  );
}

import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2 } from 'lucide-react-native';

const DELIVERIES = [
  { id: '1', business: 'Chirundu Grill House', area: 'Chirundu Town', amount: 35, time: '2:14 PM' },
  { id: '2', business: 'Zambezi Fresh Groceries', area: 'Border Area', amount: 25, time: '1:02 PM' },
  { id: '3', business: 'Riverside Pharmacy', area: 'Chirundu Town', amount: 15, time: '11:40 AM' },
];

export function HistoryScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="px-4 pb-3 pt-3">
        <Text className="font-heading text-xl text-neutral-900">Delivery history</Text>
      </View>
      <FlatList
        data={DELIVERIES}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View className="mb-2 flex-row items-center gap-3 rounded-lg bg-white p-4">
            <CheckCircle2 size={20} color="#0E6E4E" />
            <View className="flex-1">
              <Text className="font-body-semibold text-sm text-neutral-900">{item.business}</Text>
              <Text className="font-body text-xs text-neutral-500">
                {item.area} · {item.time}
              </Text>
            </View>
            <Text className="font-heading text-sm text-neutral-900">K{item.amount}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

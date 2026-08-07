import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, Wallet, Package } from 'lucide-react-native';
import { StatCard } from '../../components/StatCard';

const HISTORY = [
  { date: 'Today', amount: 350, deliveries: 8 },
  { date: 'Yesterday', amount: 410, deliveries: 10 },
  { date: 'Mon, 4 Aug', amount: 275, deliveries: 6 },
];

export function EarningsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="px-4 pb-3 pt-3">
        <Text className="font-heading text-xl text-neutral-900">Earnings</Text>
      </View>
      <ScrollView className="px-4">
        <View className="mb-5 flex-row gap-3">
          <StatCard icon={Wallet} label="This week" value="K1,035" />
          <StatCard icon={TrendingUp} label="This month" value="K4,210" />
        </View>
        <Text className="mb-3 font-heading text-base text-neutral-900">Daily breakdown</Text>
        {HISTORY.map((row) => (
          <View key={row.date} className="mb-2 flex-row items-center justify-between rounded-lg bg-white p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-50">
                <Package size={16} color="#0E6E4E" />
              </View>
              <View>
                <Text className="font-body-semibold text-sm text-neutral-900">{row.date}</Text>
                <Text className="font-body text-xs text-neutral-500">{row.deliveries} deliveries</Text>
              </View>
            </View>
            <Text className="font-heading text-sm text-neutral-900">K{row.amount}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

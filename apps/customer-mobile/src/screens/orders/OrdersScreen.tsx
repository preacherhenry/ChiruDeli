import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClipboardList } from 'lucide-react-native';
import { useOrders } from '@chirudeli/api-client';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { formatK } from '../../lib/money';

export function OrdersScreen() {
  const navigation = useAppNavigation();
  const orders = useOrders();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="px-4 pb-3 pt-3">
        <Text className="font-heading text-xl text-neutral-900">Your orders</Text>
      </View>

      {orders.isLoading ? (
        <LoadingState />
      ) : orders.isError ? (
        <ErrorState error={orders.error} onRetry={() => orders.refetch()} />
      ) : (
        <FlatList
          data={orders.data ?? []}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
              className="mb-3 gap-2 rounded-lg bg-white p-4"
            >
              <View className="flex-row items-start justify-between">
                <Text className="flex-1 font-body-semibold text-sm text-neutral-900">{item.businessName}</Text>
                <StatusBadge status={item.status} />
              </View>
              <Text className="font-body text-xs text-neutral-500" numberOfLines={1}>
                {item.itemsSummary}
              </Text>
              <View className="flex-row items-center justify-between pt-1">
                <Text className="font-body-semibold text-sm text-neutral-900">{formatK(item.total)}</Text>
                <Text className="font-body text-xs text-neutral-400">
                  Order #{item.orderNumber}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState icon={ClipboardList} title="No orders yet" description="Your order history will show up here." />
          }
        />
      )}
    </SafeAreaView>
  );
}

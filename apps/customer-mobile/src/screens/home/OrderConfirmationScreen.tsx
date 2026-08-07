import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2 } from 'lucide-react-native';
import { useOrder } from '@chirudeli/api-client';
import { useAppNavigation, useAppRoute } from '../../navigation/useAppNavigation';
import { Button } from '../../components/Button';
import { LoadingState } from '../../components/LoadingState';
import { formatK } from '../../lib/money';

export function OrderConfirmationScreen() {
  const navigation = useAppNavigation();
  const { params } = useAppRoute<'OrderConfirmation'>();
  const order = useOrder(params.orderId);

  if (order.isLoading || !order.data) return <LoadingState />;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-primary-50">
          <CheckCircle2 size={36} color="#0E6E4E" />
        </View>
        <Text className="text-center font-heading text-2xl text-neutral-900">Order placed!</Text>
        <Text className="text-center font-body text-sm text-neutral-500">
          Order #{order.data.orderNumber} from {order.data.businessName} has been sent for confirmation.
        </Text>
        <View className="w-full gap-2 rounded-lg bg-white p-4">
          <View className="flex-row justify-between">
            <Text className="font-body text-sm text-neutral-500">Total</Text>
            <Text className="font-body-semibold text-sm text-neutral-900">{formatK(order.data.totals.total)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="font-body text-sm text-neutral-500">Payment</Text>
            <Text className="font-body-semibold text-sm text-neutral-900">
              {order.data.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : order.data.paymentMethod}
            </Text>
          </View>
        </View>
        <View className="w-full gap-3 pt-4">
          <Button label="Track my order" onPress={() => navigation.replace('LiveTracking', { orderId: params.orderId })} />
          <Button label="Back to Home" variant="ghost" onPress={() => navigation.navigate('Tabs')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

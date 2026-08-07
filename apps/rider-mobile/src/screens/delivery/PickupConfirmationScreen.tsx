import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package } from 'lucide-react-native';
import { useAppNavigation, useAppRoute } from '../../navigation/useAppNavigation';
import { Button } from '../../components/Button';

export function PickupConfirmationScreen() {
  const navigation = useAppNavigation();
  const { params } = useAppRoute<'PickupConfirmation'>();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-primary-50">
          <Package size={32} color="#0E6E4E" />
        </View>
        <Text className="text-center font-heading text-xl text-neutral-900">Confirm pickup</Text>
        <Text className="text-center font-body text-sm text-neutral-500">
          Make sure the order matches before heading to the customer.
        </Text>
        <View className="w-full pt-4">
          <Button
            label="Order Collected"
            onPress={() => navigation.replace('DeliveryNavigation', { deliveryId: params.deliveryId })}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

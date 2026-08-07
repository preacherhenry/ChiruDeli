import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';
import { useAppNavigation, useAppRoute } from '../../navigation/useAppNavigation';
import { Button } from '../../components/Button';

export function DeliveryRequestScreen() {
  const navigation = useAppNavigation();
  const { params } = useAppRoute<'DeliveryRequest'>();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-between p-6">
        <View className="gap-4">
          <Text className="font-heading text-2xl text-neutral-900">Delivery accepted</Text>
          <View className="gap-3 rounded-lg bg-white p-4">
            <View className="flex-row items-center gap-2">
              <MapPin size={16} color="#0E6E4E" />
              <Text className="flex-1 font-body-semibold text-sm text-neutral-900">Chirundu Grill House</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <MapPin size={16} color="#F4A425" />
              <Text className="flex-1 font-body text-sm text-neutral-700">Chirundu Town Centre</Text>
            </View>
            <View className="flex-row justify-between border-t border-neutral-100 pt-3">
              <Text className="font-body text-xs text-neutral-500">3.2 km</Text>
              <Text className="font-body-semibold text-xs text-primary-700">K35 estimated</Text>
            </View>
          </View>
        </View>

        <Button
          label="Navigate to Pickup"
          onPress={() => navigation.replace('PickupNavigation', { deliveryId: params.deliveryId })}
        />
      </View>
    </SafeAreaView>
  );
}

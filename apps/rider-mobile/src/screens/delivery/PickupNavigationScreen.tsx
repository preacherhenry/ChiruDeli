import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';
import { useAppNavigation, useAppRoute } from '../../navigation/useAppNavigation';
import { Button } from '../../components/Button';
import { MapPlaceholder } from '../../components/MapPlaceholder';

export function PickupNavigationScreen() {
  const navigation = useAppNavigation();
  const { params } = useAppRoute<'PickupNavigation'>();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <MapPlaceholder label="Route to Chirundu Grill House" />
      <View className="flex-1 justify-between p-6">
        <View className="flex-row items-center gap-3 rounded-lg bg-white p-4">
          <MapPin size={18} color="#0E6E4E" />
          <View className="flex-1">
            <Text className="font-body-semibold text-sm text-neutral-900">Chirundu Grill House</Text>
            <Text className="font-body text-xs text-neutral-500">1.4 km away · 5 min</Text>
          </View>
        </View>
        <Button
          label="I've Arrived"
          onPress={() => navigation.replace('PickupConfirmation', { deliveryId: params.deliveryId })}
        />
      </View>
    </SafeAreaView>
  );
}

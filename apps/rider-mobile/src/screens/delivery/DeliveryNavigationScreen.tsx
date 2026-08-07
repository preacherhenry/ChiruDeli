import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Phone } from 'lucide-react-native';
import { useAppNavigation, useAppRoute } from '../../navigation/useAppNavigation';
import { Button } from '../../components/Button';
import { MapPlaceholder } from '../../components/MapPlaceholder';

export function DeliveryNavigationScreen() {
  const navigation = useAppNavigation();
  const { params } = useAppRoute<'DeliveryNavigation'>();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <MapPlaceholder label="Route to Chirundu Town Centre" />
      <View className="flex-1 justify-between p-6">
        <View className="flex-row items-center gap-3 rounded-lg bg-white p-4">
          <MapPin size={18} color="#F4A425" />
          <View className="flex-1">
            <Text className="font-body-semibold text-sm text-neutral-900">Mwansa Phiri</Text>
            <Text className="font-body text-xs text-neutral-500">Chirundu Town Centre · 3.2 km · 12 min</Text>
          </View>
          <Phone size={18} color="#0E6E4E" />
        </View>
        <Button
          label="I've Arrived"
          onPress={() => navigation.replace('DeliveryConfirmation', { deliveryId: params.deliveryId })}
        />
      </View>
    </SafeAreaView>
  );
}

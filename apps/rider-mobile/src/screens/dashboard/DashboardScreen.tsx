import { View, Text, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet, Package, Star, MapPin } from 'lucide-react-native';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useSessionStore } from '../../state/sessionStore';
import { useOnlineStatusStore } from '../../state/onlineStatusStore';
import { StatCard } from '../../components/StatCard';
import { Button } from '../../components/Button';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Sample data — real matching requires the rider-app backend (delivery
// request feed over the `rider:{riderId}` socket room, see roadmap.md).
const MOCK_REQUEST = {
  id: 'demo-delivery-1',
  pickup: 'Chirundu Grill House',
  destination: 'Chirundu Town Centre',
  distanceKm: 3.2,
  estimatedEarnings: 35,
};

export function DashboardScreen() {
  const navigation = useAppNavigation();
  const user = useSessionStore((s) => s.user);
  const { isOnline, toggle } = useOnlineStatusStore();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="flex-row items-center justify-between pb-1 pt-3">
          <View>
            <Text className="font-heading text-xl text-neutral-900">
              {greeting()}, {user?.fullName?.split(' ')[0] ?? 'Rider'}
            </Text>
            <View className="mt-1 flex-row items-center gap-2">
              <View className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-primary-600' : 'bg-neutral-300'}`} />
              <Text className="font-body text-xs text-neutral-500">{isOnline ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
          <Switch
            value={isOnline}
            onValueChange={toggle}
            trackColor={{ true: '#0E6E4E', false: '#DEE1DB' }}
          />
        </View>

        <View className="my-5 flex-row gap-3">
          <StatCard icon={Wallet} label="Today's earnings" value="K350" />
          <StatCard icon={Package} label="Deliveries" value="8" />
          <StatCard icon={Star} label="Rating" value="4.8" />
        </View>

        {isOnline ? (
          <View>
            <Text className="mb-3 font-heading text-base text-neutral-900">New delivery</Text>
            <View className="gap-3 rounded-lg bg-white p-4">
              <View className="flex-row items-center gap-2">
                <MapPin size={16} color="#0E6E4E" />
                <Text className="flex-1 font-body-semibold text-sm text-neutral-900">{MOCK_REQUEST.pickup}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <MapPin size={16} color="#F4A425" />
                <Text className="flex-1 font-body text-sm text-neutral-700">{MOCK_REQUEST.destination}</Text>
              </View>
              <View className="flex-row justify-between border-t border-neutral-100 pt-3">
                <Text className="font-body text-xs text-neutral-500">Distance: {MOCK_REQUEST.distanceKm} km</Text>
                <Text className="font-body-semibold text-xs text-primary-700">
                  Estimated earnings: K{MOCK_REQUEST.estimatedEarnings}
                </Text>
              </View>
              <View className="flex-row gap-2 pt-1">
                <View className="flex-1">
                  <Button label="Decline" variant="outline" onPress={() => {}} />
                </View>
                <View className="flex-1">
                  <Button
                    label="Accept"
                    onPress={() => navigation.navigate('DeliveryRequest', { deliveryId: MOCK_REQUEST.id })}
                  />
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View className="items-center gap-2 rounded-lg bg-white p-8">
            <Text className="text-center font-body text-sm text-neutral-500">
              You're offline. Go online to start receiving delivery requests.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

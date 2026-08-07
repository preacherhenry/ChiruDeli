import { useState } from 'react';
import { View, Text } from 'react-native';
import * as Location from 'expo-location';
import { MapPin } from 'lucide-react-native';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { useLocationStore } from '../../state/locationStore';

export function LocationPermissionScreen() {
  const [requesting, setRequesting] = useState(false);
  const setLocation = useLocationStore((s) => s.setLocation);
  const setPermissionAsked = useLocationStore((s) => s.setPermissionAsked);

  const onAllow = async () => {
    setRequesting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync({});
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      }
    } finally {
      setPermissionAsked();
      setRequesting(false);
    }
  };

  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-6 px-8">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-primary-50">
          <MapPin size={32} color="#0E6E4E" />
        </View>
        <View className="gap-2">
          <Text className="text-center font-heading text-xl text-neutral-900">
            Where should we deliver?
          </Text>
          <Text className="text-center font-body text-sm text-neutral-500">
            Share your location so we can show businesses that deliver to you and calculate
            accurate delivery fees.
          </Text>
        </View>
        <View className="w-full gap-3">
          <Button label="Allow location access" onPress={onAllow} loading={requesting} />
          <Button label="Not now" variant="ghost" onPress={setPermissionAsked} />
        </View>
      </View>
    </Screen>
  );
}

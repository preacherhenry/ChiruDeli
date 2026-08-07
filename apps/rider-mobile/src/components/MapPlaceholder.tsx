import { View, Text } from 'react-native';
import { Map } from 'lucide-react-native';

/**
 * Real turn-by-turn navigation needs react-native-maps + a Google Maps key
 * (see customer-mobile's TrackingMap for the pattern) — reserved for when
 * the rider app is wired to the real API in a follow-up session.
 */
export function MapPlaceholder({ label }: { label: string }) {
  return (
    <View className="h-56 items-center justify-center gap-2 bg-neutral-100">
      <Map size={28} color="#9BA097" />
      <Text className="font-body text-xs text-neutral-400">{label}</Text>
    </View>
  );
}

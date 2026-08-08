import { View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import type { Coordinates } from '@chirudeli/shared-types';

/**
 * Only ever mounted when EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is configured (see
 * LiveTrackingScreen) — react-native-maps needs a native Google Maps key to
 * render tiles, and importing/mounting MapView with no key would either
 * crash or render a blank grey box, so the caller gates this out entirely.
 */
export function TrackingMap({
  pickups,
  dropoff,
  rider,
}: {
  pickups: Array<{ location: Coordinates; label: string; completed: boolean }>;
  dropoff: Coordinates;
  rider: Coordinates | null;
}) {
  const points = [...pickups.map((p) => p.location), dropoff, ...(rider ? [rider] : [])];
  const latitudes = points.map((p) => p.latitude);
  const longitudes = points.map((p) => p.longitude);
  const region = {
    latitude: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
    longitude: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    latitudeDelta: Math.max(0.02, Math.max(...latitudes) - Math.min(...latitudes)) * 1.8,
    longitudeDelta: Math.max(0.02, Math.max(...longitudes) - Math.min(...longitudes)) * 1.8,
  };

  return (
    <View style={{ height: 220 }}>
      <MapView provider={PROVIDER_GOOGLE} style={{ flex: 1 }} region={region}>
        {pickups.map((p, i) => (
          <Marker
            key={i}
            coordinate={p.location}
            title={p.label}
            pinColor={p.completed ? '#9AA0A6' : '#0E6E4E'}
          />
        ))}
        <Marker coordinate={dropoff} title="Delivery address" pinColor="#F4A425" />
        {rider ? <Marker coordinate={rider} title="Rider" pinColor="#2E7BD6" /> : null}
        {rider ? <Polyline coordinates={[rider, dropoff]} strokeColor="#0E6E4E" strokeWidth={3} /> : null}
      </MapView>
    </View>
  );
}

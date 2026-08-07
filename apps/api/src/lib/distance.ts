export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Swappable so a real routing provider (Google Distance Matrix, OSRM) can
 * replace straight-line distance later without touching callers. */
export interface DistanceProvider {
  distanceKm(a: Coordinates, b: Coordinates): number;
}

const EARTH_RADIUS_KM = 6371;

export class HaversineDistanceProvider implements DistanceProvider {
  distanceKm(a: Coordinates, b: Coordinates): number {
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);

    const h =
      Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return Math.round(EARTH_RADIUS_KM * c * 100) / 100;
  }
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export const distanceProvider: DistanceProvider = new HaversineDistanceProvider();

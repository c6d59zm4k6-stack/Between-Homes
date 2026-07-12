export interface Coords {
  lat: number;
  lng: number;
}

/**
 * Turns a city name into rough coordinates using OpenStreetMap's free
 * Nominatim service — no API key, no cost. Accuracy is city-level, which
 * is exactly what we need to notice "the phone is now near the departure
 * city" vs "near the destination city," not precise navigation.
 */
export async function geocodeCity(cityName: string): Promise<Coords | null> {
  if (!cityName.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      cityName
    )}`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en" },
    });
    if (!res.ok) return null;
    const results = await res.json();
    if (!results?.length) return null;
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } catch {
    return null; // geocoding is a nice-to-have, never block journey creation on it
  }
}

/** Distance between two coordinates in kilometers (haversine formula). */
export function distanceKm(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

import tzLookup from "tz-lookup";

export async function venueTimezone(postalCode: string | null, country: string | null) {
  if (!postalCode || !/^\d{5}(?:-\d{4})?$/.test(postalCode) || (country && !["US", "USA", "UNITED STATES"].includes(country.toUpperCase()))) return null;
  try {
    const response = await fetch(`https://api.zippopotam.us/us/${postalCode.slice(0, 5)}`, { cache: "force-cache", signal: AbortSignal.timeout(4000) });
    if (!response.ok) return null;
    const result = await response.json();
    const place = result.places?.[0];
    const latitude = Number(place?.latitude);
    const longitude = Number(place?.longitude);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? tzLookup(latitude, longitude) : null;
  } catch { return null; }
}

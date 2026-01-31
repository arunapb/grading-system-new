/**
 * IP Geolocation Utility
 * Uses ipgeolocation.io (Requires API Key, 1000 requests/day on Free Tier)
 */

export interface GeoLocationData {
  country: string | null;
  region: string | null;
  city: string | null;
  lat: number | null;
  lon: number | null;
  isp: string | null;
  org: string | null;
  timezone: string | null;
}

/**
 * Fetches geolocation data for a given IP address.
 * Returns null fields if the lookup fails or IP is private/unknown.
 */
export async function getGeoLocation(ip: string): Promise<GeoLocationData> {
  const defaultData: GeoLocationData = {
    country: null,
    region: null,
    city: null,
    lat: null,
    lon: null,
    isp: null,
    org: null,
    timezone: null,
  };

  // Skip lookup for localhost/private IPs
  if (!ip || ip === "Unknown" || ip === "127.0.0.1" || ip === "::1") {
    return defaultData;
  }

  try {
    // Rate limit: 1000 requests/day (Free Tier)
    const apiKey = process.env.IP_GEOLOCATION_API_KEY;

    if (!apiKey) {
      console.warn(
        "IP_GEOLOCATION_API_KEY is not set. Geolocation lookup skipped.",
      );
      return defaultData;
    }

    const response = await fetch(
      `https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}&ip=${ip}`,
      { next: { revalidate: 3600 } },
    );

    if (!response.ok) {
      console.error(
        "Geolocation API error:",
        response.status,
        response.statusText,
      );
      return defaultData;
    }

    const data = await response.json();

    // Note: ISP/Org fields may be restricted on Free Tier
    return {
      country: data.country_name || null,
      region: data.state_prov || data.district || null,
      city: data.city || null,
      lat: data.latitude ? parseFloat(data.latitude) : null,
      lon: data.longitude ? parseFloat(data.longitude) : null,
      isp: data.isp || null,
      org: data.organization || null,
      timezone: data.time_zone ? data.time_zone.name : null,
    };
  } catch (error) {
    console.error("Failed to fetch geolocation:", error);
    return defaultData;
  }
}

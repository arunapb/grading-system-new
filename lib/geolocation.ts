/**
 * IP Geolocation Utility
 * Uses ip-api.com (free for non-commercial use, 45 requests/min limit)
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
    // ip-api.com free endpoint (http only, no API key needed)
    // Fields: country, regionName, city, lat, lon, isp, org, timezone
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon,isp,org,timezone`,
      { next: { revalidate: 3600 } }, // Cache for 1 hour
    );

    if (!response.ok) {
      console.error("Geolocation API error:", response.status);
      return defaultData;
    }

    const data = await response.json();

    if (data.status === "fail") {
      console.warn("Geolocation lookup failed for IP:", ip, data.message);
      return defaultData;
    }

    return {
      country: data.country || null,
      region: data.regionName || null,
      city: data.city || null,
      lat: data.lat || null,
      lon: data.lon || null,
      isp: data.isp || null,
      org: data.org || null,
      timezone: data.timezone || null,
    };
  } catch (error) {
    console.error("Failed to fetch geolocation:", error);
    return defaultData;
  }
}

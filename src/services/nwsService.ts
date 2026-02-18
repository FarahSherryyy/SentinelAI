import axios from 'axios'
import { SeverityLevel, magnitudeToSeverity } from '../utils/formatters'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Threat {
  id: string
  source: 'NWS' | 'USGS'
  type: string
  severity: SeverityLevel
  headline: string
  description: string
  areaDesc: string
  effective: string | number
  expires: string | number | null
  coordinates?: [number, number]
  magnitude?: number
}

// ─── NWS Service ─────────────────────────────────────────────────────────────

export const fetchNWSAlerts = async (stateCode: string): Promise<Threat[]> => {
  try {
    // Use proxy in development, direct API in production
    const baseUrl = import.meta.env.DEV 
      ? '/nws'
      : 'https://api.weather.gov'

    const response = await axios.get(
      `${baseUrl}/alerts/active?area=${stateCode}`,
      {
        headers: {
          'User-Agent': 'SentinelAI/1.0 (emergency-monitor@sentinelai.dev)',
          Accept: 'application/geo+json',
        },
      }
    )

    const features = response.data?.features ?? []

    return features
      .slice(0, 10) // limit to 10 alerts max
      .map((feature: any): Threat => {
        const p = feature.properties
        const coordinates = getCoordinatesFromGeometry(feature.geometry)

        return {
          id: feature.id ?? crypto.randomUUID(),
          source: 'NWS',
          type: p.event ?? 'Weather Alert',
          severity: normalizeSeverity(p.severity),
          headline: p.headline ?? p.event ?? 'Weather Alert',
          description: p.description ?? 'No description available.',
          areaDesc: p.areaDesc ?? 'Unknown area',
          effective: p.effective ?? new Date().toISOString(),
          expires: p.expires ?? null,
          ...(coordinates && { coordinates }),
        }
      })
  } catch (error) {
    console.error('NWS fetch error:', error)
    return []
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract [lat, lng] from NWS GeoJSON geometry for map display.
 * NWS uses Point, Polygon, or MultiPolygon; we use center/first point.
 */
function getCoordinatesFromGeometry(geometry: any): [number, number] | null {
  if (!geometry?.coordinates) return null

  const c = geometry.coordinates

  switch (geometry.type) {
    case 'Point':
      // GeoJSON Point is [lng, lat]
      return Array.isArray(c) && c.length >= 2 ? [c[1], c[0]] : null
    case 'Polygon':
      // First ring is exterior; first point is [lng, lat]
      const ring = c?.[0]
      if (Array.isArray(ring) && ring.length > 0 && Array.isArray(ring[0]) && ring[0].length >= 2) {
        return [ring[0][1], ring[0][0]]
      }
      return null
    case 'MultiPolygon':
      const firstRing = c?.[0]?.[0]
      const firstPoint = Array.isArray(firstRing) ? firstRing[0] : null
      if (Array.isArray(firstPoint) && firstPoint.length >= 2) {
        return [firstPoint[1], firstPoint[0]]
      }
      return null
    default:
      return null
  }
}

const normalizeSeverity = (raw: string): SeverityLevel => {
  switch (raw) {
    case 'Extreme':
      return 'Extreme'
    case 'Severe':
      return 'Severe'
    case 'Moderate':
      return 'Moderate'
    case 'Minor':
      return 'Minor'
    default:
      return 'Unknown'
  }
}
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
    const response = await axios.get(
      `/nws/alerts/active?area=${stateCode}`,
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
        }
      })
  } catch (error) {
    console.error('NWS fetch error:', error)
    return []
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
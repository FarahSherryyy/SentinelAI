import { useState, useEffect, useCallback } from 'react'
import { Threat, fetchNWSAlerts } from '../services/nwsService'
import { fetchUSGSEarthquakes } from '../services/usgsService'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseThreatsReturn {
  threats: Threat[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  selectedThreat: Threat | null
  setSelectedThreat: (threat: Threat) => void
  refresh: () => void
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useThreats = (stateCode: string): UseThreatsReturn => {
  const [threats, setThreats] = useState<Threat[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null)

  const fetchAll = useCallback(async () => {
    if (!stateCode) return

    setLoading(true)
    setError(null)

    try {
      // Fetch from both sources in parallel
      const [nwsThreats, usgsThreats] = await Promise.all([
        fetchNWSAlerts(stateCode),
        fetchUSGSEarthquakes(stateCode),
      ])

      // Merge and sort by severity then time
      const allThreats = [...nwsThreats, ...usgsThreats].sort((a, b) => {
        const severityOrder = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 }
        const aOrder = severityOrder[a.severity] ?? 4
        const bOrder = severityOrder[b.severity] ?? 4

        if (aOrder !== bOrder) return aOrder - bOrder

        // If same severity, sort by most recent
        const aTime = typeof a.effective === 'number' ? a.effective : new Date(a.effective).getTime()
        const bTime = typeof b.effective === 'number' ? b.effective : new Date(b.effective).getTime()
        return bTime - aTime
      })

      setThreats(allThreats)
      setLastUpdated(new Date())

      // Auto-select first threat if none selected
      if (allThreats.length > 0 && !selectedThreat) {
        setSelectedThreat(allThreats[0])
      }

    } catch (err) {
      setError('Failed to fetch threat data. Please try again.')
      console.error('useThreats error:', err)
    } finally {
      setLoading(false)
    }
  }, [stateCode])

  // Fetch on mount and when state changes
  useEffect(() => {
    setSelectedThreat(null)
    fetchAll()
  }, [stateCode])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchAll, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchAll])

  return {
    threats,
    loading,
    error,
    lastUpdated,
    selectedThreat,
    setSelectedThreat,
    refresh: fetchAll,
  }
}
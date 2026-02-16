import { useState, useEffect } from 'react'
import { getStateName } from '../utils/formatters'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavBarProps {
  selectedState: string
  onStateChange: (stateCode: string) => void
  lastUpdated: Date | null
  onRefresh: () => void
  loading: boolean
}

// ─── State Options ────────────────────────────────────────────────────────────

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

// ─── Component ────────────────────────────────────────────────────────────────

const NavBar = ({
  selectedState,
  onStateChange,
  lastUpdated,
  onRefresh,
  loading,
}: NavBarProps) => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('sentinel-theme') as 'dark' | 'light' | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    }
  }, [])

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('sentinel-theme', newTheme)
  }

  const formatLastUpdated = (date: Date | null): string => {
    if (!date) return 'Never'
    const mins = Math.floor((Date.now() - date.getTime()) / 60000)
    if (mins < 1) return 'Just now'
    if (mins === 1) return '1 min ago'
    return `${mins} mins ago`
  }

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo">
        <span className="logo-icon">🛡️</span>
        <span className="logo-text">SentinelAI</span>
      </div>

      {/* Live Status */}
      <div className="navbar-center">
        <span className="pulse-dot"></span>
        <span className="live-text">Live</span>
        <span className="updated-text">
          Updated {formatLastUpdated(lastUpdated)}
        </span>
      </div>

      {/* Controls */}
      <div className="navbar-controls">
        <select
          className="state-selector"
          value={selectedState}
          onChange={(e) => onStateChange(e.target.value)}
        >
          {US_STATES.map((code) => (
            <option key={code} value={code}>
              {getStateName(code)} ({code})
            </option>
          ))}
        </select>

        <button
          className="theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <button
          className={`btn btn-outline refresh-btn ${loading ? 'spinning' : ''}`}
          onClick={onRefresh}
          disabled={loading}
          title="Refresh threats"
        >
          <span className={loading ? 'spin-icon' : ''}>↻</span>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </nav>
  )
}

export default NavBar
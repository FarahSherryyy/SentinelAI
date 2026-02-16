// Severity levels for both NWS and USGS threats
export type SeverityLevel = 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown'

// Returns the CSS class name based on severity
export const getSeverityColor = (severity: SeverityLevel): string => {
  switch (severity) {
    case 'Extreme':
      return 'severity-extreme'
    case 'Severe':
      return 'severity-severe'
    case 'Moderate':
      return 'severity-moderate'
    case 'Minor':
      return 'severity-minor'
    default:
      return 'severity-unknown'
  }
}

// Returns hex color based on severity
export const getSeverityHex = (severity: SeverityLevel): string => {
  switch (severity) {
    case 'Extreme':
      return '#FF3B3B'
    case 'Severe':
      return '#F59E0B'
    case 'Moderate':
      return '#EAB308'
    case 'Minor':
      return '#10B981'
    default:
      return '#6B7280'
  }
}

// Formats a date string or timestamp to "X mins ago" or "X hrs ago"
export const timeAgo = (dateInput: string | number): string => {
  const date = typeof dateInput === 'number' ? new Date(dateInput) : new Date(dateInput)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

// Formats a date string to readable local time
export const formatTime = (dateInput: string | number): string => {
  const date = typeof dateInput === 'number' ? new Date(dateInput) : new Date(dateInput)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

// Formats a date string to readable local date + time
export const formatDateTime = (dateInput: string | number): string => {
  const date = typeof dateInput === 'number' ? new Date(dateInput) : new Date(dateInput)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

// Converts USGS magnitude to severity level
export const magnitudeToSeverity = (magnitude: number): SeverityLevel => {
  if (magnitude >= 7.0) return 'Extreme'
  if (magnitude >= 5.5) return 'Severe'
  if (magnitude >= 4.0) return 'Moderate'
  if (magnitude >= 2.5) return 'Minor'
  return 'Unknown'
}

// Truncates long text with ellipsis
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// Gets threat type icon emoji based on event name
export const getThreatIcon = (eventType: string): string => {
  const type = eventType.toLowerCase()
  if (type.includes('tornado')) return '🌪️'
  if (type.includes('hurricane') || type.includes('tropical')) return '🌀'
  if (type.includes('flood')) return '🌊'
  if (type.includes('snow') || type.includes('winter') || type.includes('ice') || type.includes('blizzard')) return '❄️'
  if (type.includes('thunder') || type.includes('lightning')) return '⛈️'
  if (type.includes('earthquake')) return '🔴'
  if (type.includes('fire')) return '🔥'
  if (type.includes('wind')) return '💨'
  if (type.includes('heat')) return '🌡️'
  if (type.includes('fog')) return '🌫️'
  return '⚠️'
}

// Gets US state name from state code
export const getStateName = (code: string): string => {
  const states: Record<string, string> = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas',
    CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
    FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
    IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
    KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
    MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
    NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
    NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
    OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
    SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
    VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
    WI: 'Wisconsin', WY: 'Wyoming',
  }
  return states[code] || code
}
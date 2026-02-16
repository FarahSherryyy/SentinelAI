import { Threat } from '../services/nwsService'
import { getSeverityColor, timeAgo, getThreatIcon, truncate } from '../utils/formatters'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ThreatFeedProps {
  threats: Threat[]
  loading: boolean
  error: string | null
  selectedThreat: Threat | null
  onSelectThreat: (threat: Threat) => void
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="threat-card" style={{ cursor: 'default' }}>
    <div className="threat-card-top">
      <div className="skeleton" style={{ width: 70, height: 18, borderRadius: 999 }} />
      <div className="skeleton" style={{ width: 50, height: 12 }} />
    </div>
    <div className="skeleton" style={{ width: '80%', height: 14, marginTop: 8 }} />
    <div className="skeleton" style={{ width: '60%', height: 12, marginTop: 6 }} />
  </div>
)

// ─── Component ────────────────────────────────────────────────────────────────

const ThreatFeed = ({
  threats,
  loading,
  error,
  selectedThreat,
  onSelectThreat,
}: ThreatFeedProps) => {
  return (
    <div className="column">
      <div className="column-inner">

        {/* Header */}
        <div className="column-header">
          <span className="pulse-dot red" />
          <h2>Active Threats</h2>
          {threats.length > 0 && (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-input)',
                padding: '2px 8px',
                borderRadius: 999,
                border: '1px solid var(--border-light)',
              }}
            >
              {threats.length}
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}

        {/* Threat List */}
        <div className="threat-list">

          {/* Loading skeletons */}
          {loading && threats.length === 0 && (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}

          {/* Empty state */}
          {!loading && threats.length === 0 && !error && (
            <div className="empty-state">
              <span className="icon">✅</span>
              <p>No active threats in selected region</p>
            </div>
          )}

          {/* Threat cards */}
          {threats.map((threat) => {
            const isActive = selectedThreat?.id === threat.id
            const severityClass = threat.severity.toLowerCase()
            const icon = getThreatIcon(threat.type)
            const timeLabel = timeAgo(threat.effective)

            return (
              <div
                key={threat.id}
                className={`threat-card ${isActive ? `active ${severityClass}` : ''}`}
                onClick={() => onSelectThreat(threat)}
              >
                <div className="threat-card-top">
                  <span className={`severity-badge ${getSeverityColor(threat.severity)}`}>
                    {threat.severity}
                  </span>
                  <span className="threat-card-time">{timeLabel}</span>
                </div>

                <div className="threat-card-title">
                  <span>{icon}</span>
                  <span>{truncate(threat.type, 30)}</span>
                </div>

                <div className="threat-card-area">
                  📍 {truncate(threat.areaDesc, 45)}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      background: 'var(--bg-input)',
                      padding: '1px 6px',
                      borderRadius: 999,
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    {threat.source}
                  </span>
                  {isActive && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Selected →
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ThreatFeed
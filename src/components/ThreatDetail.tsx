import { useState } from 'react'
import { Threat } from '../services/nwsService'
import {
  getSeverityColor,
  getThreatIcon,
  formatDateTime,
  timeAgo,
} from '../utils/formatters'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ThreatDetailProps {
  threat: Threat | null
}

// ─── Component ────────────────────────────────────────────────────────────────

const ThreatDetail = ({ threat }: ThreatDetailProps) => {
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [showOriginalText, setShowOriginalText] = useState(true)

  // Empty state — no threat selected
  if (!threat) {
    return (
      <div className="empty-state">
        <span className="icon">🎯</span>
        <p>Select a threat from the feed to view details</p>
      </div>
    )
  }

  const icon = getThreatIcon(threat.type)
  const effectiveLabel = formatDateTime(threat.effective)
  const expiresLabel = threat.expires ? formatDateTime(threat.expires) : 'Ongoing'
  const timeLabel = timeAgo(threat.effective)

  // Generate AI summary
  const handleGenerateSummary = async () => {
    if (!threat.description) return

    setIsGeneratingSummary(true)
    setSummaryError(null)

    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

      if (!apiKey) {
        throw new Error('API key not configured')
      }

      const prompt = `You are an emergency management expert. Create a concise, clear summary of this emergency alert for the general public.

REQUIREMENTS:
- Write 3-5 sentences maximum
- Use simple, direct language
- Convert ALL CAPS to normal case
- Focus on: What's happening, when, where, and what people should do
- Remove technical jargon
- Keep urgent/critical information
- Make it immediately understandable
- Professional but accessible tone

ORIGINAL ALERT:
${threat.description}

THREAT TYPE: ${threat.type}
SEVERITY: ${threat.severity}
LOCATION: ${threat.areaDesc}

SUMMARY:`

      // Use proxy in development, direct API in production
      const apiUrl = import.meta.env.DEV
        ? '/groq/openai/v1/chat/completions'
        : 'https://api.groq.com/openai/v1/chat/completions'

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 300,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const data = await response.json()
      const summary = data.choices?.[0]?.message?.content?.trim() || ''
      
      setAiSummary(summary)
      setShowOriginalText(false)

    } catch (err: any) {
      setSummaryError(err.message || 'Unable to generate summary. Please try again.')
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  return (
    <div className="threat-detail">

      {/* Top Row — Badge + Source */}
      <div className="threat-detail-header">
        <span className={`severity-badge ${getSeverityColor(threat.severity)}`}>
          {threat.severity}
        </span>
        <span className="source-tag">
          Source: {threat.source}
          {threat.magnitude && ` · M${threat.magnitude.toFixed(1)}`}
        </span>
      </div>

      {/* Title */}
      <div className="threat-detail-title">
        {icon} {threat.type}
      </div>

      {/* Meta Info */}
      <div className="threat-detail-meta">
        <div className="threat-detail-meta-row">
          <span>🕐</span>
          <span>
            Issued: <strong style={{ color: 'var(--text-primary)' }}>{effectiveLabel}</strong>
            <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
              ({timeLabel})
            </span>
          </span>
        </div>

        <div className="threat-detail-meta-row">
          <span>⏱️</span>
          <span>
            Expires:{' '}
            <strong
              style={{
                color: threat.expires
                  ? 'var(--text-primary)'
                  : 'var(--amber)',
              }}
            >
              {expiresLabel}
            </strong>
          </span>
        </div>

        {threat.coordinates && (
          <div className="threat-detail-meta-row">
            <span>🌐</span>
            <span>
              Coordinates: {threat.coordinates[0].toFixed(3)}°,{' '}
              {threat.coordinates[1].toFixed(3)}°
            </span>
          </div>
        )}
      </div>

      {/* Description */}
      <div style={{ 
        fontSize: '0.75rem',
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginTop: '16px',
        marginBottom: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        📋 Threat Details
      </div>

      {/* AI Summary Box */}
      {aiSummary && (
        <div className="ai-summary-box">
          <div className="ai-summary-header">
            🤖 AI SUMMARY
          </div>
          <div className="ai-summary-text">
            {aiSummary}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {summaryError && (
        <div className="error-banner" style={{ marginBottom: '12px' }}>
          ⚠️ {summaryError}
        </div>
      )}

      {/* Original Text Toggle (when summary exists) */}
      {aiSummary && (
        <button
          className="original-text-toggle"
          onClick={() => setShowOriginalText(!showOriginalText)}
        >
          📄 {showOriginalText ? 'Hide' : 'View'} Official Details {showOriginalText ? '▲' : '▼'}
        </button>
      )}

      {/* Description - shown by default or when toggled */}
      {(!aiSummary || showOriginalText) && (
        <div className="threat-detail-description">
          {threat.description}
        </div>
      )}

      {/* Generate Summary Button */}
      {!aiSummary && threat.description && threat.description.length > 50 && (
        <button
          className={`summary-button ${isGeneratingSummary ? 'loading' : ''}`}
          onClick={handleGenerateSummary}
          disabled={isGeneratingSummary}
        >
          {isGeneratingSummary ? (
            <>
              <span className="spin-icon">↻</span>
              Generating summary...
            </>
          ) : (
            <>
              ✨ Generate AI Summary
            </>
          )}
        </button>
      )}

    </div>
  )
}

export default ThreatDetail
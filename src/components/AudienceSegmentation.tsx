// ─── Imports ──────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Threat } from '../services/nwsService'
import {
  analyzeAudienceSegmentation,
  SegmentationAnalysis,
  AudienceSegment,
  CommunicationChannel,
} from '../services/grokService'
import './AudienceSegmentation.css'

// ─── Types ────────────────────────────────────────────────────────────────

interface AudienceSegmentationProps {
  threat: Threat | null
  onGenerateForSegment?: (segment: AudienceSegment) => void
}

// ─── Constants ────────────────────────────────────────────────────────────

const CHANNEL_ICONS: Record<string, string> = {
  'SMS': '📱',
  'Email': '📧',
  'Phone Call': '☎️',
  'Siren': '🚨',
  'Social Media': '💬',
  'Radio': '📻',
  'TV': '📺',
  'Mobile App': '📲',
  'Door-to-Door': '🚪',
}

const PRIORITY_COLORS: Record<string, string> = {
  'Critical': '#ef4444',
  'High': '#f59e0b',
  'Medium': '#eab308',
  'Low': '#3b82f6',
}

// ─── Main Component ───────────────────────────────────────────────────────

const AudienceSegmentation = ({ threat, onGenerateForSegment }: AudienceSegmentationProps) => {
  const [analysis, setAnalysis] = useState<SegmentationAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null)

  // Clear analysis when threat changes (no auto-fetch to reduce API cost)
  useEffect(() => {
    if (!threat) {
      setAnalysis(null)
      setError(null)
      return
    }
    setAnalysis(null)
    setError(null)
    setExpandedSegment(null)
  }, [threat?.id])

  const fetchAnalysis = async () => {
    if (!threat) return
    setLoading(true)
    setError(null)
    try {
      const result = await analyzeAudienceSegmentation(threat)
      setAnalysis(result)
      setExpandedSegment(null)
    } catch (err) {
      console.error('Failed to analyze audience segmentation:', err)
      setError('Failed to analyze audience segments.')
    } finally {
      setLoading(false)
    }
  }

  const toggleSegment = (segmentId: string) => {
    setExpandedSegment(expandedSegment === segmentId ? null : segmentId)
  }

  // Empty state
  if (!threat) {
    return (
      <div className="audience-segmentation">
        <div className="segmentation-header">
          <h2>👥 Audience Segmentation</h2>
          <span className="ai-badge">AI-Powered</span>
        </div>
        <div className="segmentation-empty">
          <div className="empty-icon">👥</div>
          <p>Select a threat to view target audiences</p>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="audience-segmentation">
        <div className="segmentation-header">
          <h2>👥 Audience Segmentation</h2>
          <span className="ai-badge">AI-Powered</span>
        </div>
        <div className="segmentation-loading">
          <div className="spinner"></div>
          <p>Analyzing audiences...</p>
        </div>
      </div>
    )
  }

  // Error state (with retry button)
  if (error) {
    return (
      <div className="audience-segmentation">
        <div className="segmentation-header">
          <h2>👥 Audience Segmentation</h2>
          <span className="ai-badge">AI-Powered</span>
        </div>
        <div className="segmentation-error">
          <span>⚠️</span>
          <p>{error}</p>
          <button type="button" className="segmentation-generate-btn" onClick={fetchAnalysis}>
            🔄 Try Again
          </button>
        </div>
      </div>
    )
  }

  // Threat selected but no analysis yet — show generate button (saves API cost)
  if (!analysis) {
    return (
      <div className="audience-segmentation">
        <div className="segmentation-header">
          <h2>👥 Audience Segmentation</h2>
          <span className="ai-badge">AI-Powered</span>
        </div>
        <div className="segmentation-generate-prompt">
          <p>Get AI-powered audience segments and recommended channels for this threat.</p>
          <button
            type="button"
            className="segmentation-generate-btn"
            onClick={fetchAnalysis}
            disabled={loading}
          >
            {loading ? 'Analyzing…' : '✨ Generate with AI'}
          </button>
        </div>
      </div>
    )
  }

  // Sort segments by priority
  const sortedSegments = sortByPriority(analysis.segments)

  return (
    <div className="audience-segmentation">
      
      {/* Header */}
      <div className="segmentation-header">
        <h2>👥 Audience Segmentation</h2>
        <span className="ai-badge">AI-Powered</span>
        <button
          type="button"
          className="segmentation-refresh-btn"
          onClick={fetchAnalysis}
          title="Regenerate segmentation"
        >
          🔄
        </button>
      </div>

      {/* Summary Stats */}
      <div className="seg-summary">
        <div className="seg-stat">
          <span className="seg-stat-value">{analysis.segments.length}</span>
          <span className="seg-stat-label">Segments</span>
        </div>
        <div className="seg-stat">
          <span className="seg-stat-value critical">{analysis.overallReach.criticalSegments}</span>
          <span className="seg-stat-label">Critical</span>
        </div>
        <div className="seg-stat">
          <span className="seg-stat-value">{analysis.overallReach.totalAffectedPopulation}</span>
          <span className="seg-stat-label">Total Reach</span>
        </div>
      </div>

      {/* Next-step hint: use Draft Alert with AI */}
      <div className="seg-next-step-hint">
        <span className="seg-next-step-icon">💡</span>
        <p>
          Expand a segment and click <strong>Generate Alert for [segment]</strong>, then use <strong>Draft Alert with AI</strong> below to create your message.
        </p>
      </div>

      {/* Segments List */}
      <div className="segments-list">
        {sortedSegments.map((segment) => (
          <SegmentCard
            key={segment.id}
            segment={segment}
            isExpanded={expandedSegment === segment.id}
            onToggle={() => toggleSegment(segment.id)}
            onGenerate={onGenerateForSegment}
            priorityColor={PRIORITY_COLORS[segment.priority]}
          />
        ))}
      </div>

    </div>
  )
}

// ─── Sub-Components ───────────────────────────────────────────────────────

interface SegmentCardProps {
  segment: AudienceSegment
  isExpanded: boolean
  onToggle: () => void
  onGenerate?: (segment: AudienceSegment) => void
  priorityColor: string
}

const SegmentCard = ({ segment, isExpanded, onToggle, onGenerate, priorityColor }: SegmentCardProps) => {
  return (
    <div className={`seg-card ${isExpanded ? 'expanded' : ''}`}>
      
      {/* Card Header - Always Visible */}
      <button className="seg-card-header" onClick={onToggle}>
        <div className="seg-card-title-row">
          <div className="seg-card-left">
            <span 
              className="seg-priority-dot" 
              style={{ background: priorityColor }}
            ></span>
            <h4>{segment.name}</h4>
          </div>
          <span className="seg-expand-icon">{isExpanded ? '▼' : '▶'}</span>
        </div>
        <div className="seg-card-meta">
          <span className="seg-size">👤 {segment.estimatedSize}</span>
          <span className="seg-priority" style={{ color: priorityColor }}>
            {segment.priority}
          </span>
        </div>
      </button>

      {/* Card Details - Shown When Expanded */}
      {isExpanded && (
        <div className="seg-card-body">
          
          {/* Description */}
          <p className="seg-description">{segment.description}</p>

          {/* Top Channels */}
          <div className="seg-section">
            <h5>📱 Top Channels</h5>
            <div className="seg-channels">
              {segment.recommendedChannels.slice(0, 3).map((channel, index) => (
                <div key={index} className="seg-channel-item">
                  <span className="seg-channel-name">
                    {CHANNEL_ICONS[channel.channel]} {channel.channel}
                  </span>
                  <span className="seg-channel-effectiveness">{channel.effectiveness}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Actions */}
          <div className="seg-section">
            <h5>✅ Key Actions</h5>
            <ul className="seg-action-list">
              {segment.messageCustomization.actionItems.slice(0, 3).map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>

          {/* Generate Alert Button */}
          {onGenerate && (
            <button 
              className="seg-generate-btn"
              onClick={(e) => {
                e.stopPropagation()
                onGenerate(segment)
              }}
            >
              ✨ Generate Alert for {segment.name}
            </button>
          )}

        </div>
      )}
    </div>
  )
}

// ─── Helper Functions ─────────────────────────────────────────────────────

const sortByPriority = (segments: AudienceSegment[]): AudienceSegment[] => {
  const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 }
  return [...segments].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}

export default AudienceSegmentation

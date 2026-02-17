// ─── Imports ──────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { Threat } from '../services/nwsService'
import {
  predictThreatEscalation,
  analyzeCompoundRisks,
  EscalationPrediction,
  CompoundRiskAnalysis,
} from '../services/grokService'
import './ThreatEscalation.css'

// ─── Types ────────────────────────────────────────────────────────────────

interface ThreatEscalationProps {
  threat: Threat | null
  allThreats: Threat[]
}

// ─── Component ────────────────────────────────────────────────────────────

const ThreatEscalation = ({ threat, allThreats }: ThreatEscalationProps) => {
  const [prediction, setPrediction] = useState<EscalationPrediction | null>(null)
  const [compoundRisk, setCompoundRisk] = useState<CompoundRiskAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showHistorical, setShowHistorical] = useState(false)

  // Fetch prediction when threat changes
  useEffect(() => {
    if (!threat) {
      setPrediction(null)
      setCompoundRisk(null)
      return
    }

    const fetchPrediction = async () => {
      setLoading(true)
      setError(null)

      try {
        // Get escalation prediction for selected threat
        const escalation = await predictThreatEscalation(threat)
        setPrediction(escalation)

        // Get compound risk analysis if multiple threats
        if (allThreats.length >= 2) {
          const compound = await analyzeCompoundRisks(allThreats)
          setCompoundRisk(compound)
        } else {
          setCompoundRisk(null)
        }
      } catch (err) {
        console.error('Failed to fetch threat prediction:', err)
        setError('Failed to generate prediction. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchPrediction()
  }, [threat?.id, allThreats.length])

  // Empty state
  if (!threat) {
    return (
      <div className="threat-escalation">
        <div className="escalation-empty">
          <div className="empty-icon">🔮</div>
          <h3>No Threat Selected</h3>
          <p>Select a threat from the feed to view AI-powered escalation predictions</p>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="threat-escalation">
        <div className="escalation-header">
          <h2>🤖 Threat Escalation Prediction</h2>
          <span className="ai-badge">Powered by Groq AI</span>
        </div>
        <div className="escalation-loading">
          <div className="spinner"></div>
          <p>Analyzing threat patterns...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="threat-escalation">
        <div className="escalation-header">
          <h2>🤖 Threat Escalation Prediction</h2>
          <span className="ai-badge">Powered by Groq AI</span>
        </div>
        <div className="escalation-error">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!prediction) return null

  return (
    <div className="threat-escalation">
      
      {/* Header */}
      <div className="escalation-header">
        <h2>🤖 Threat Escalation Prediction</h2>
        <span className="ai-badge">Powered by Groq AI</span>
      </div>

      {/* Escalation Timeline */}
      <div className="escalation-timeline">
        <div className="timeline-item current">
          <div className={`severity-indicator ${prediction.currentSeverity.toLowerCase()}`}>
            {getSeverityIcon(prediction.currentSeverity)}
          </div>
          <div className="timeline-label">
            <span className="timeline-status">Current</span>
            <span className="timeline-severity">{prediction.currentSeverity}</span>
          </div>
        </div>

        <div className="timeline-arrow">
          <div className="arrow-line"></div>
          <div className="arrow-head">→</div>
          <span className="timeline-duration">{prediction.timeframe}</span>
        </div>

        <div className="timeline-item predicted">
          <div className={`severity-indicator ${prediction.predictedSeverity.toLowerCase()}`}>
            {getSeverityIcon(prediction.predictedSeverity)}
          </div>
          <div className="timeline-label">
            <span className="timeline-status">Predicted</span>
            <span className="timeline-severity">{prediction.predictedSeverity}</span>
          </div>
        </div>
      </div>

      {/* Probability & Confidence */}
      <div className="prediction-metrics">
        <div className="metric-card">
          <h3>Escalation Probability</h3>
          <div className="probability-gauge">
            <div className="gauge-bar">
              <div 
                className={`gauge-fill ${getProbabilityLevel(prediction.escalationProbability)}`}
                style={{ width: `${prediction.escalationProbability}%` }}
              ></div>
            </div>
            <span className="gauge-value">{prediction.escalationProbability}%</span>
          </div>
        </div>

        <div className="metric-card">
          <h3>AI Confidence</h3>
          <span className={`confidence-badge ${prediction.confidence.toLowerCase()}`}>
            {getConfidenceIcon(prediction.confidence)} {prediction.confidence}
          </span>
        </div>
      </div>

      {/* Reasoning */}
      <div className="prediction-section">
        <h3>📊 Analysis</h3>
        <p className="reasoning-text">{prediction.reasoning}</p>
      </div>

      {/* Early Warning Indicators */}
      {prediction.earlyWarningIndicators.length > 0 && (
        <div className="prediction-section">
          <h3>⚡ Early Warning Indicators</h3>
          <ul className="indicator-list">
            {prediction.earlyWarningIndicators.map((indicator, index) => (
              <li key={index} className="indicator-item">
                <span className="indicator-icon">→</span>
                <span>{indicator}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Actions */}
      {prediction.recommendedActions.length > 0 && (
        <div className="prediction-section">
          <h3>📋 Recommended Actions</h3>
          <ol className="action-list">
            {prediction.recommendedActions.map((action, index) => (
              <li key={index} className="action-item">
                <span className="action-number">{index + 1}</span>
                <span className="action-text">{action}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Historical Comparison */}
      {prediction.historicalComparison && (
        <div className="prediction-section collapsible">
          <button 
            className="section-toggle"
            onClick={() => setShowHistorical(!showHistorical)}
          >
            <h3>📚 Historical Context</h3>
            <span className="toggle-icon">{showHistorical ? '▲' : '▼'}</span>
          </button>
          {showHistorical && (
            <p className="historical-text">{prediction.historicalComparison}</p>
          )}
        </div>
      )}

      {/* Compound Risk Alert */}
      {compoundRisk && compoundRisk.hasCompoundRisk && (
        <div className={`compound-risk-alert ${compoundRisk.riskLevel.toLowerCase()}`}>
          <div className="alert-header">
            <span className="alert-icon">⚠️</span>
            <h3>Compound Risk Detected</h3>
            <span className={`risk-level-badge ${compoundRisk.riskLevel.toLowerCase()}`}>
              {compoundRisk.riskLevel}
            </span>
          </div>
          
          <p className="alert-summary">{compoundRisk.overallSummary}</p>

          {compoundRisk.interactions.length > 0 && (
            <div className="interactions-list">
              <h4>Threat Interactions:</h4>
              {compoundRisk.interactions.map((interaction, index) => (
                <div key={index} className="interaction-item">
                  <div className="interaction-threats">
                    <span className="threat-name">{interaction.threat1}</span>
                    <span className="interaction-symbol">⚡</span>
                    <span className="threat-name">{interaction.threat2}</span>
                  </div>
                  <p className="interaction-type">{interaction.interactionType}</p>
                  <p className="interaction-impact">{interaction.combinedImpact}</p>
                </div>
              ))}
            </div>
          )}

          {compoundRisk.cascadingEffects.length > 0 && (
            <div className="cascading-effects">
              <h4>Cascading Effects:</h4>
              <ul>
                {compoundRisk.cascadingEffects.map((effect, index) => (
                  <li key={index}>{effect}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

    </div>
  )
}

// ─── Helper Functions ─────────────────────────────────────────────────────

const getSeverityIcon = (severity: string): string => {
  switch (severity) {
    case 'Extreme': return '🔴'
    case 'Severe': return '🟠'
    case 'Moderate': return '🟡'
    case 'Minor': return '🟢'
    default: return '⚪'
  }
}

const getConfidenceIcon = (confidence: string): string => {
  switch (confidence) {
    case 'High': return '🎯'
    case 'Medium': return '📊'
    case 'Low': return '📉'
    default: return '📊'
  }
}

const getProbabilityLevel = (probability: number): string => {
  if (probability >= 75) return 'high'
  if (probability >= 50) return 'medium'
  return 'low'
}

export default ThreatEscalation

import { useState } from 'react'
import { GeneratedAlerts } from './DraftControls'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AlertOutputProps {
  alerts: GeneratedAlerts | null
}

// ─── Component ────────────────────────────────────────────────────────────────

const AlertOutput = ({ alerts }: AlertOutputProps) => {
  const [showToast, setShowToast] = useState(false)

  // Handle copy
  const handleCopy = async (message: string) => {
    if (!message) return

    try {
      await navigator.clipboard.writeText(message)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = message
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    }
  }

  return (
    <div className="alert-output">
      <div className="alert-output-inner">

        {/* Header */}
        <div className="output-header">
          <span>🔔</span>
          <h2>Generated Alert</h2>
        </div>

        {/* Empty State */}
        {!alerts && (
          <div className="empty-state" style={{ flex: 1 }}>
            <span className="icon">✨</span>
            <p>
              Select a threat and click Draft Alert to generate messages
            </p>
          </div>
        )}

        {/* SMS Section */}
        {alerts && (
          <div className="message-section">
            <div className="message-header">
              <span className="message-type-badge">📱 SMS</span>
              <span className={`char-count ${alerts.sms.length > 160 ? 'over' : ''}`}>
                {alerts.sms.length} / 160
              </span>
            </div>
            <div className="message-box">{alerts.sms}</div>
            {alerts.sms.length > 160 && (
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--red-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                ⚠️ SMS exceeds 160 characters — consider shortening
              </div>
            )}
            <div className="message-actions">
              <button 
                className="btn btn-outline" 
                onClick={() => handleCopy(alerts.sms)}
              >
                📋 Copy
              </button>
              <button className="btn btn-outline">
                ✏️ Edit
              </button>
            </div>
          </div>
        )}

        {/* Email Section */}
        {alerts && (
          <div className="message-section">
            <div className="message-header">
              <span className="message-type-badge">📧 Email</span>
            </div>
            <div className="message-box">{alerts.email}</div>
            <div className="message-actions">
              <button 
                className="btn btn-outline" 
                onClick={() => handleCopy(alerts.email)}
              >
                📋 Copy
              </button>
              <button className="btn btn-outline">
                ✏️ Edit
              </button>
            </div>
          </div>
        )}

        {/* Voice Section */}
        {alerts && (
          <div className="message-section">
            <div className="message-header">
              <span className="message-type-badge">🎤 Voice Script</span>
            </div>
            <div className="message-box">{alerts.voice}</div>
            <div className="message-actions">
              <button 
                className="btn btn-outline" 
                onClick={() => handleCopy(alerts.voice)}
              >
                📋 Copy
              </button>
              <button className="btn btn-outline">
                ✏️ Edit
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Toast */}
      {showToast && (
        <div className="toast">✅ Copied to clipboard</div>
      )}
    </div>
  )
}

export default AlertOutput

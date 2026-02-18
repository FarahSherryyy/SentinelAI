import { useState, useEffect } from 'react'
import { Threat } from '../services/nwsService'
import { formatDateTime } from '../utils/formatters'
import { AudienceSegment } from '../services/grokService'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AudienceType = 'General Public' | 'Schools' | 'Utilities'
export type ToneType = 'Urgent' | 'Informational' | 'All-Clear'

export interface GeneratedAlerts {
  sms: string
  email: string
  voice: string
}

interface DraftControlsProps {
  threat: Threat | null
  selectedSegment?: AudienceSegment | null
  onAlertsGenerated: (alerts: GeneratedAlerts) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

const DraftControls = ({ threat, selectedSegment, onAlertsGenerated }: DraftControlsProps) => {
  const [audience, setAudience] = useState<AudienceType>('General Public')
  const [tone, setTone] = useState<ToneType>('Urgent')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const audiences: AudienceType[] = ['General Public', 'Schools', 'Utilities']
  const tones: ToneType[] = ['Urgent', 'Informational', 'All-Clear']

  // Update audience/tone when segment is selected
  useEffect(() => {
    if (selectedSegment) {
      // Map segment priority to tone
      const toneMap: Record<string, ToneType> = {
        'Critical': 'Urgent',
        'High': 'Urgent',
        'Medium': 'Informational',
        'Low': 'Informational',
      }
      setTone(toneMap[selectedSegment.priority] || 'Urgent')
    }
  }, [selectedSegment])

  const handleDraft = async () => {
    if (!threat) return

    setLoading(true)
    setError(null)

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY

      if (!apiKey || apiKey === 'your_grok_api_key_here') {
        throw new Error('Please add your Groq API key to the .env file')
      }

      const prompt = buildPrompt(threat, audience, tone, selectedSegment)

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
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData?.error?.message ?? 'Groq API error')
      }

      const data = await response.json()
      const rawText = data.choices?.[0]?.message?.content ?? ''
      const parsed = parseAlerts(rawText)
      onAlertsGenerated(parsed)

    } catch (err: any) {
      setError(err.message ?? 'Failed to generate alerts. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="draft-controls">

      {/* Title */}
      <div className="draft-controls-title">
        ✨ Generate Alert Message
        {selectedSegment && (
          <div style={{ 
            fontSize: '12px', 
            color: 'rgba(255,255,255,0.6)', 
            fontWeight: 'normal',
            marginTop: '4px'
          }}>
            For: {selectedSegment.name}
          </div>
        )}
      </div>

      {/* Audience Selector */}
      <div className="control-row">
        <span className="control-label">Audience</span>
        <div className="toggle-group">
          {audiences.map((a) => (
            <button
              key={a}
              className={`toggle-pill ${audience === a ? 'active' : ''}`}
              onClick={() => setAudience(a)}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Tone Selector */}
      <div className="control-row">
        <span className="control-label">Tone</span>
        <div className="toggle-group">
          {tones.map((t) => (
            <button
              key={t}
              className={`toggle-pill ${tone === t ? 'active' : ''}`}
              onClick={() => setTone(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* Draft Button */}
      <div className="draft-btn-wrapper">
        <button
          className="btn btn-primary"
          onClick={handleDraft}
          disabled={!threat || loading}
        >
          {loading ? (
            <>
              <span className="spin-icon">↻</span>
              Drafting message...
            </>
          ) : (
            <>
              ✨ Draft Alert with AI
            </>
          )}
        </button>
        <span className="powered-by">Powered by Groq AI</span>
      </div>

    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildPrompt = (
  threat: Threat,
  audience: AudienceType,
  tone: ToneType,
  segment?: AudienceSegment | null
): string => {
  const expires = threat.expires
    ? formatDateTime(threat.expires)
    : 'until further notice'

  // If segment is selected, customize the prompt
  const segmentInfo = segment ? `

AUDIENCE SEGMENT:
- Target: ${segment.name}
- Description: ${segment.description}
- Population: ${segment.estimatedSize}
- Priority: ${segment.priority}
- Recommended Tone: ${segment.messageCustomization.tone}

KEY POINTS TO INCLUDE:
${segment.messageCustomization.keyPoints.map(p => `- ${p}`).join('\n')}

ACTION ITEMS:
${segment.messageCustomization.actionItems.map(a => `- ${a}`).join('\n')}

IMPORTANT: Tailor the message specifically for this audience segment.` : ''

  return `You are an emergency communications officer for a public safety agency.

A threat has been detected with the following details:
- Type: ${threat.type}
- Severity: ${threat.severity}
- Location: ${threat.areaDesc}
- Details: ${threat.description}
- Expires: ${expires}
- Source: ${threat.source}${segmentInfo}

Generate exactly 3 alert messages for the following parameters:
- Audience: ${audience}
- Tone: ${tone}

Format your response EXACTLY like this with no extra text:

SMS:
[Your SMS message here - maximum 160 characters, plain language]

EMAIL:
[Your email message here - 2-3 sentences, professional and clear]

VOICE:
[Your voice script here - 30 seconds when read aloud, calm and instructional]`
}

const parseAlerts = (raw: string): GeneratedAlerts => {
  const smsMatch = raw.match(/SMS:\s*([\s\S]*?)(?=EMAIL:|$)/i)
  const emailMatch = raw.match(/EMAIL:\s*([\s\S]*?)(?=VOICE:|$)/i)
  const voiceMatch = raw.match(/VOICE:\s*([\s\S]*?)$/i)

  return {
    sms: smsMatch?.[1]?.trim() ?? 'Could not parse SMS message.',
    email: emailMatch?.[1]?.trim() ?? 'Could not parse email message.',
    voice: voiceMatch?.[1]?.trim() ?? 'Could not parse voice script.',
  }
}

export default DraftControls
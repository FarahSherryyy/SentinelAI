// ─── Imports ──────────────────────────────────────────────────────────────
import { Threat } from './nwsService'
import { SeverityLevel } from '../utils/formatters'

// ─── Types & Interfaces ───────────────────────────────────────────────────

export interface EscalationPrediction {
  threatId: string
  currentSeverity: SeverityLevel
  predictedSeverity: SeverityLevel
  escalationProbability: number // 0-100
  timeframe: string // e.g., "6 hours", "24 hours", "48 hours"
  confidence: 'Low' | 'Medium' | 'High'
  reasoning: string
  earlyWarningIndicators: string[]
  recommendedActions: string[]
  historicalComparison?: string
}

export interface CompoundRiskAnalysis {
  hasCompoundRisk: boolean
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'
  interactions: Array<{
    threat1: string
    threat2: string
    interactionType: string
    combinedImpact: string
  }>
  cascadingEffects: string[]
  overallSummary: string
}

interface GrokResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

// ─── Constants ────────────────────────────────────────────────────────────

const MODEL = 'llama-3.3-70b-versatile'

// ─── Main Functions ───────────────────────────────────────────────────────

/**
 * Predicts if a single threat will escalate in the next 6-48 hours
 */
export const predictThreatEscalation = async (
  threat: Threat
): Promise<EscalationPrediction> => {
  try {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY

    if (!apiKey) {
      throw new Error('Groq API key not found. Please add VITE_GROQ_API_KEY to your .env file.')
    }

    const prompt = buildEscalationPrompt(threat)

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
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status} ${response.statusText}`)
    }

    const data: GrokResponse = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response content from Groq API')
    }

    // Clean markdown code fences if present
    const cleanedContent = cleanJsonResponse(content)
    const prediction = JSON.parse(cleanedContent)

    // Return with threatId attached
    return {
      threatId: threat.id,
      currentSeverity: threat.severity,
      predictedSeverity: prediction.predictedSeverity || threat.severity,
      escalationProbability: prediction.escalationProbability || 0,
      timeframe: prediction.timeframe || '24 hours',
      confidence: prediction.confidence || 'Medium',
      reasoning: prediction.reasoning || 'No reasoning provided.',
      earlyWarningIndicators: prediction.earlyWarningIndicators || [],
      recommendedActions: prediction.recommendedActions || [],
      historicalComparison: prediction.historicalComparison,
    }
  } catch (error) {
    console.error('Error predicting threat escalation:', error)
    
    // Return fallback prediction
    return {
      threatId: threat.id,
      currentSeverity: threat.severity,
      predictedSeverity: threat.severity,
      escalationProbability: 0,
      timeframe: '24 hours',
      confidence: 'Low',
      reasoning: 'Unable to generate prediction. Please check API configuration.',
      earlyWarningIndicators: [],
      recommendedActions: ['Monitor threat status closely', 'Follow official guidance'],
      historicalComparison: undefined,
    }
  }
}

/**
 * Analyzes multiple threats for compound disaster risks
 */
export const analyzeCompoundRisks = async (
  threats: Threat[]
): Promise<CompoundRiskAnalysis> => {
  try {
    // Need at least 2 threats to analyze compound risks
    if (threats.length < 2) {
      return {
        hasCompoundRisk: false,
        riskLevel: 'Low',
        interactions: [],
        cascadingEffects: [],
        overallSummary: 'Single threat detected. No compound risk analysis available.',
      }
    }

    const apiKey = import.meta.env.VITE_GROQ_API_KEY

    if (!apiKey) {
      throw new Error('Groq API key not found.')
    }

    const prompt = buildCompoundRiskPrompt(threats)

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
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`)
    }

    const data: GrokResponse = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No response content from Groq API')
    }

    const cleanedContent = cleanJsonResponse(content)
    const analysis = JSON.parse(cleanedContent)

    return {
      hasCompoundRisk: analysis.hasCompoundRisk || false,
      riskLevel: analysis.riskLevel || 'Low',
      interactions: analysis.interactions || [],
      cascadingEffects: analysis.cascadingEffects || [],
      overallSummary: analysis.overallSummary || 'No compound risks detected.',
    }
  } catch (error) {
    console.error('Error analyzing compound risks:', error)
    
    // Return fallback analysis
    return {
      hasCompoundRisk: false,
      riskLevel: 'Low',
      interactions: [],
      cascadingEffects: [],
      overallSummary: 'Unable to analyze compound risks. Monitoring individual threats.',
    }
  }
}

// ─── Helper Functions ─────────────────────────────────────────────────────

/**
 * Builds the prompt for single threat escalation prediction
 */
const buildEscalationPrompt = (threat: Threat): string => {
  return `You are an expert emergency management analyst specializing in threat prediction.

CURRENT THREAT:
Type: ${threat.type}
Severity: ${threat.severity}
Location: ${threat.areaDesc}
Description: ${threat.description}
Time: ${threat.effective}
${threat.expires ? `Expires: ${threat.expires}` : ''}

Analyze this threat and predict if it will escalate in the next 6-48 hours.
Respond with ONLY valid JSON (no markdown):
{
  "currentSeverity": "${threat.severity}",
  "predictedSeverity": "<predicted level in 6-48 hours>",
  "escalationProbability": <0-100>,
  "timeframe": "<when escalation expected>",
  "confidence": "<Low|Medium|High>",
  "reasoning": "<why you predict this>",
  "earlyWarningIndicators": ["indicator1", "indicator2"],
  "recommendedActions": ["action1", "action2"],
  "historicalComparison": "<similar past events>"
}`
}

/**
 * Builds the prompt for compound risk analysis
 */
const buildCompoundRiskPrompt = (threats: Threat[]): string => {
  const threatsList = threats
    .map((t, i) => `${i + 1}. ${t.type} (${t.severity}) - ${t.areaDesc}`)
    .join('\n')

  return `You are analyzing multiple simultaneous threats for compound disaster risks.

ACTIVE THREATS:
${threatsList}

Identify if these threats interact to create compound risks or cascading failures.
Respond with ONLY valid JSON:
{
  "hasCompoundRisk": <true|false>,
  "riskLevel": "<Low|Medium|High|Critical>",
  "interactions": [
    {
      "threat1": "<threat name>",
      "threat2": "<threat name>",
      "interactionType": "<how they interact>",
      "combinedImpact": "<what happens when combined>"
    }
  ],
  "cascadingEffects": ["effect1", "effect2"],
  "overallSummary": "<2-3 sentence summary>"
}`
}

/**
 * Cleans JSON response by removing markdown code fences
 */
const cleanJsonResponse = (content: string): string => {
  let cleaned = content.trim()

  // Remove markdown code fences
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '')
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '')
  }

  return cleaned.trim()
}

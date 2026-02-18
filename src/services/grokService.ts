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

export interface AudienceSegment {
  id: string
  name: string
  description: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  estimatedSize: string
  vulnerabilityFactors: string[]
  recommendedChannels: CommunicationChannel[]
  messageCustomization: {
    tone: 'Urgent' | 'Alert' | 'Advisory' | 'Informational'
    keyPoints: string[]
    actionItems: string[]
  }
}

export interface CommunicationChannel {
  channel: 'SMS' | 'Email' | 'Phone Call' | 'Siren' | 'Social Media' | 'Radio' | 'TV' | 'Mobile App' | 'Door-to-Door'
  effectiveness: number // 0-100
  reasoning: string
}

export interface SegmentationAnalysis {
  threatId: string
  segments: AudienceSegment[]
  overallReach: {
    totalAffectedPopulation: string
    criticalSegments: number
    recommendedChannelMix: string[]
  }
  urgencyLevel: 'Immediate' | 'Within 1 Hour' | 'Within 6 Hours' | 'Within 24 Hours'
  specialConsiderations: string[]
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

/**
 * Analyzes audience segmentation for targeted emergency communications
 */
export const analyzeAudienceSegmentation = async (
  threat: Threat
): Promise<SegmentationAnalysis> => {
  try {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY

    if (!apiKey) {
      throw new Error('Groq API key not found.')
    }

    const prompt = buildSegmentationPrompt(threat)

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
      threatId: threat.id,
      segments: analysis.segments || [],
      overallReach: analysis.overallReach || {
        totalAffectedPopulation: 'Unknown',
        criticalSegments: 0,
        recommendedChannelMix: ['SMS', 'Email'],
      },
      urgencyLevel: analysis.urgencyLevel || 'Within 24 Hours',
      specialConsiderations: analysis.specialConsiderations || [],
    }
  } catch (error) {
    console.error('Error analyzing audience segmentation:', error)
    
    // Return fallback segmentation
    return {
      threatId: threat.id,
      segments: getFallbackSegments(threat),
      overallReach: {
        totalAffectedPopulation: 'Unable to estimate',
        criticalSegments: 1,
        recommendedChannelMix: ['SMS', 'Email', 'Social Media'],
      },
      urgencyLevel: 'Within 24 Hours',
      specialConsiderations: ['Unable to analyze. Using general segmentation.'],
    }
  }
}

/**
 * Builds the prompt for audience segmentation analysis
 */
const buildSegmentationPrompt = (threat: Threat): string => {
  const expires = threat.expires 
    ? new Date(threat.expires).toLocaleString()
    : 'Ongoing'

  return `You are an emergency communications specialist. Analyze this threat and identify which audience segments should be notified.

THREAT DETAILS:
Type: ${threat.type}
Severity: ${threat.severity}
Location: ${threat.areaDesc}
Description: ${threat.description}
Timeframe: ${new Date(threat.effective).toLocaleString()} to ${expires}

TASK: Identify all relevant audience segments that need to be notified. Consider:
- Geographic proximity to threat
- Vulnerability factors (age, mobility, medical needs)
- Occupation/role (first responders, healthcare, education, utilities)
- Infrastructure dependencies (power, water, transportation)

For EACH segment, provide:
- Clear name and description
- Priority level (Critical/High/Medium/Low)
- Estimated population size
- Vulnerability factors
- Best communication channels ranked by effectiveness
- Message tone and key points tailored to that audience

Respond with ONLY valid JSON (no markdown):
{
  "segments": [
    {
      "id": "segment-1",
      "name": "Segment Name",
      "description": "Description of this audience",
      "priority": "Critical",
      "estimatedSize": "~X,XXX people",
      "vulnerabilityFactors": ["factor1", "factor2"],
      "recommendedChannels": [
        {
          "channel": "SMS",
          "effectiveness": 95,
          "reasoning": "Why this channel works for this audience"
        }
      ],
      "messageCustomization": {
        "tone": "Urgent",
        "keyPoints": ["point1", "point2"],
        "actionItems": ["action1", "action2"]
      }
    }
  ],
  "overallReach": {
    "totalAffectedPopulation": "~XX,XXX people across N segments",
    "criticalSegments": 2,
    "recommendedChannelMix": ["SMS", "Siren", "Social Media"]
  },
  "urgencyLevel": "Immediate",
  "specialConsiderations": [
    "consideration1",
    "consideration2"
  ]
}

IMPORTANT: Include these common segments when relevant:
- Coastal/flood zone residents, Schools, Healthcare facilities, First responders
- Critical infrastructure workers, Transportation hubs, Vulnerable populations
- Business districts, Tourist areas, Mobile home parks, High-rise buildings`
}

/**
 * Provides fallback segments when AI analysis fails
 */
const getFallbackSegments = (threat: Threat): AudienceSegment[] => {
  return [
    {
      id: 'general-public',
      name: 'General Public',
      description: `Residents in ${threat.areaDesc}`,
      priority: 'High',
      estimatedSize: 'Unknown',
      vulnerabilityFactors: ['Direct threat exposure'],
      recommendedChannels: [
        {
          channel: 'SMS',
          effectiveness: 85,
          reasoning: 'Broad reach and immediate delivery',
        },
        {
          channel: 'Social Media',
          effectiveness: 75,
          reasoning: 'Wide distribution and shareability',
        },
      ],
      messageCustomization: {
        tone: 'Alert',
        keyPoints: [
          `${threat.type} in your area`,
          `Severity: ${threat.severity}`,
          'Follow official guidance',
        ],
        actionItems: [
          'Monitor local news and weather',
          'Prepare emergency supplies',
          'Stay informed of updates',
        ],
      },
    },
    {
      id: 'first-responders',
      name: 'First Responders',
      description: 'Police, Fire, EMS personnel',
      priority: 'Critical',
      estimatedSize: 'Unknown',
      vulnerabilityFactors: ['Direct exposure during response operations'],
      recommendedChannels: [
        {
          channel: 'Mobile App',
          effectiveness: 95,
          reasoning: 'Secure, direct communication channel',
        },
        {
          channel: 'Radio',
          effectiveness: 90,
          reasoning: 'Reliable during infrastructure failures',
        },
      ],
      messageCustomization: {
        tone: 'Urgent',
        keyPoints: [
          'Operational readiness required',
          `${threat.type} - ${threat.severity}`,
          'Coordinate response efforts',
        ],
        actionItems: [
          'Review response protocols',
          'Check equipment and supplies',
          'Establish command structure',
        ],
      },
    },
  ]
}

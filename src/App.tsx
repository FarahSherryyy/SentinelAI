import { useState, useRef } from 'react'
import './App.css'
import NavBar from './components/NavBar'
import ThreatFeed from './components/ThreatFeed'
import ThreatDetail from './components/ThreatDetail'
import ThreatEscalation from './components/ThreatEscalation'
import AudienceSegmentation from './components/AudienceSegmentation'
import DraftControls from './components/DraftControls'
import AlertOutput from './components/AlertOutput'
import { useThreats } from './hooks/useThreats'
import { GeneratedAlerts } from './components/DraftControls'
import { AudienceSegment } from './services/grokService'

// ─── Component ────────────────────────────────────────────────────────────────

const App = () => {
  const [selectedState, setSelectedState] = useState<string>('TX')
  const [generatedAlerts, setGeneratedAlerts] = useState<GeneratedAlerts | null>(null)
  const [selectedSegment, setSelectedSegment] = useState<AudienceSegment | null>(null)
  const draftControlsRef = useRef<HTMLDivElement>(null)
  const alertOutputRef = useRef<HTMLDivElement>(null)

  const {
    threats,
    loading,
    error,
    lastUpdated,
    selectedThreat,
    setSelectedThreat,
    refresh,
  } = useThreats(selectedState)

  // When state changes reset generated alerts
  const handleStateChange = (stateCode: string) => {
    setSelectedState(stateCode)
    setGeneratedAlerts(null)
    setSelectedSegment(null)
  }

  // When threat changes reset generated alerts
  const handleSelectThreat = (threat: any) => {
    setSelectedThreat(threat)
    setGeneratedAlerts(null)
    setSelectedSegment(null)
  }

  // When user clicks "Generate Alert for Segment" (message will auto-generate; we scroll to message when it's ready via handleAlertsGenerated)
  const handleGenerateForSegment = (segment: AudienceSegment) => {
    setSelectedSegment(segment)
    setGeneratedAlerts(null)
  }

  // When alerts are generated, scroll to the message section so the user sees the result
  const handleAlertsGenerated = (alerts: GeneratedAlerts) => {
    setGeneratedAlerts(alerts)
    setTimeout(() => {
      alertOutputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 150)
  }

  return (
    <div className="app">

      {/* Navigation */}
      <NavBar
        selectedState={selectedState}
        onStateChange={handleStateChange}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        loading={loading}
      />

      {/* Main 3-column layout */}
      <div className="main-content">

        {/* Left Column — Threat Feed */}
        <ThreatFeed
          threats={threats}
          loading={loading}
          error={error}
          selectedThreat={selectedThreat}
          onSelectThreat={handleSelectThreat}
        />

        {/* Center Column — Analysis: Detail + Escalation */}
        <div className="center-column">
          <ThreatDetail threat={selectedThreat} />
          <ThreatEscalation threat={selectedThreat} allThreats={threats} />
        </div>

        {/* Right Column — Alert Generation: Segmentation + Draft Controls + Alert Output */}
        <div className="right-column">
          <AudienceSegmentation 
            threat={selectedThreat} 
            onGenerateForSegment={handleGenerateForSegment}
          />
          <div ref={draftControlsRef}>
            <DraftControls
              threat={selectedThreat}
              selectedSegment={selectedSegment}
              onAlertsGenerated={handleAlertsGenerated}
            />
          </div>
          <div ref={alertOutputRef}>
            <AlertOutput alerts={generatedAlerts} />
          </div>
        </div>

      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="sources">
          <span>Data sources:</span>
          <span className="source-badge">🌤️ NWS Weather Alerts</span>
          <span className="source-badge">🔴 USGS Earthquake Feed</span>
        </div>
        <span>SentinelAI monitors threats in real-time 24/7</span>
        <span>
          {lastUpdated
            ? `Last sync: ${lastUpdated.toLocaleTimeString()}`
            : 'Waiting for data...'}
        </span>
      </div>

    </div>
  )
}

export default App
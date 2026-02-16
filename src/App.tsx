import { useState } from 'react'
import './App.css'
import NavBar from './components/NavBar'
import ThreatFeed from './components/ThreatFeed'
import ThreatDetail from './components/ThreatDetail'
import DraftControls from './components/DraftControls'
import AlertOutput from './components/AlertOutput'
import { useThreats } from './hooks/useThreats'
import { GeneratedAlerts } from './components/DraftControls'

// ─── Component ────────────────────────────────────────────────────────────────

const App = () => {
  const [selectedState, setSelectedState] = useState<string>('TX')
  const [generatedAlerts, setGeneratedAlerts] = useState<GeneratedAlerts | null>(null)

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
  }

  // When threat changes reset generated alerts
  const handleSelectThreat = (threat: any) => {
    setSelectedThreat(threat)
    setGeneratedAlerts(null)
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

        {/* Center Column — Detail + Draft Controls */}
        <div className="center-column">
          <ThreatDetail threat={selectedThreat} />
          <DraftControls
            threat={selectedThreat}
            onAlertsGenerated={setGeneratedAlerts}
          />
        </div>

        {/* Right Column — Alert Output */}
        <AlertOutput alerts={generatedAlerts} />

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
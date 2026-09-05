import React, { useState } from 'react';
import RevenueLossLanding from './pages/RevenueLossLanding';
import ScenarioView from './pages/ScenarioView';
import PaymentRecoveryDashboard from './pages/PaymentRecoveryDashboard';
import './index.css';

export default function App() {
  const [activeScenarioDef, setActiveScenarioDef] = useState(null);

  if (!activeScenarioDef) {
    return <RevenueLossLanding onSelectScenario={setActiveScenarioDef} />;
  }

  // Payment failure gets the dedicated agentic loop dashboard
  if (activeScenarioDef.id === 'PAYMENT_FAILED') {
    return (
      <PaymentRecoveryDashboard
        onExit={() => setActiveScenarioDef(null)}
      />
    );
  }

  return (
    <ScenarioView
      activeScenarioDef={activeScenarioDef}
      setActiveScenarioDef={setActiveScenarioDef}
      onExit={() => setActiveScenarioDef(null)}
    />
  );
}

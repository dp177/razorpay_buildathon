import { useState, useEffect } from 'react';

const API_BASE = typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '4173')
  ? '/api'
  : 'http://127.0.0.1:8000/api';

export function useScenarioPolling(scenarioId) {
  const [data, setData] = useState({
    simState: null,
    run: null,
    traces: [],
    timeline: null
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!scenarioId) return;

    let interval = setInterval(async () => {
      try {
        // Fetch Simulation State
        const simRes = await fetch(`${API_BASE}/simulation/${scenarioId}`);
        if (!simRes.ok) return;
        const simState = await simRes.json();

        // If we have a run_id, fetch run data
        let run = null;
        let traces = [];
        let timeline = null;

        if (simState.run_id) {
          const runRes = await fetch(`${API_BASE}/agent-runs/${simState.run_id}`);
          if (runRes.ok) run = await runRes.json();

          const tracesRes = await fetch(`${API_BASE}/agent-runs/${simState.run_id}/traces`);
          if (tracesRes.ok) traces = await tracesRes.json();

          const tlRes = await fetch(`${API_BASE}/agent-runs/${simState.run_id}/timeline`);
          if (tlRes.ok) timeline = await tlRes.json();
        }

        setData({
          simState,
          run,
          traces,
          timeline
        });

        // Stop polling if completed and outcome is generated
        if (simState.status === 'COMPLETED' && timeline?.outcomes?.length > 0) {
          clearInterval(interval);
        }
      } catch (err) {
        setError(err);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [scenarioId]);

  return { ...data, error };
}

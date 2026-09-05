import React, { useState } from 'react';
import { Play, Pause, FastForward, Clock } from 'lucide-react';

export default function SimulationDock({ scenarioId, simState, handleAdvanceTime }) {
  const [advancing, setAdvancing] = useState(null);

  const advance = async (hours) => {
    setAdvancing(hours);
    await handleAdvanceTime(hours);
    setAdvancing(null);
  };

  const isCompleted = simState?.status === 'COMPLETED';
  const disabled = !scenarioId || isCompleted || advancing !== null;

  return (
    <div className="h-16 border-t border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-500 font-bold tracking-widest text-xs uppercase">
          <Clock size={16} />
          <span>Simulation Controls</span>
        </div>
        
        {isCompleted && (
          <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded text-xs font-bold tracking-wider">
            SCENARIO COMPLETE
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <button disabled className="p-2 text-slate-400 hover:text-slate-600 rounded border border-transparent hover:border-slate-200 transition-colors">
          <Pause size={18} />
        </button>
        
        <div className="w-px h-8 bg-slate-200 mx-2"></div>

        <button 
          disabled={disabled} 
          onClick={() => advance(1)} 
          className="px-4 py-2 text-sm font-medium border border-slate-300 hover:bg-slate-50 rounded shadow-sm text-slate-700 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {advancing === 1 ? 'ADVANCING...' : '+1 HOUR'}
        </button>
        <button 
          disabled={disabled} 
          onClick={() => advance(6)} 
          className="px-4 py-2 text-sm font-medium border border-slate-300 hover:bg-slate-50 rounded shadow-sm text-slate-700 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {advancing === 6 ? 'ADVANCING...' : '+6 HOURS'}
        </button>
        <button 
          disabled={disabled} 
          onClick={() => advance(24)} 
          className="px-6 py-2 text-sm font-bold bg-indigo-600 border border-indigo-700 hover:bg-indigo-700 text-white shadow-md rounded disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {advancing === 24 ? 'ADVANCING...' : '+24 HOURS'}
        </button>
        <button 
          disabled={disabled} 
          onClick={() => advance(168)} 
          className="px-4 py-2 text-sm font-medium border border-slate-300 hover:bg-slate-50 rounded shadow-sm text-slate-700 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {advancing === 168 ? 'ADVANCING...' : '+7 DAYS'}
        </button>
      </div>
    </div>
  );
}

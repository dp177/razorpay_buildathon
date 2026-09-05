import React from 'react';
import { Shield, Clock, User, RotateCcw } from 'lucide-react';

export default function TopBar({ activeScenarioDef, simState, onReset }) {
  return (
    <div className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-20">
      
      {/* Center: Agent Name */}
      <div className="flex-1 flex justify-center">
        {activeScenarioDef && (
          <div className="font-bold text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
            <activeScenarioDef.icon size={16} className="text-indigo-600" />
            {activeScenarioDef.agentName}
          </div>
        )}
      </div>

      {/* Right: Test Mode, Profile */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-bold tracking-wider" title="No production customer communication or payment is performed.">
          <Shield size={14} />
          TEST MODE
        </div>

        {simState?.virtual_time && (
          <div className="flex items-center gap-2 text-slate-600 text-sm font-mono bg-slate-50 px-3 py-1 rounded border border-slate-200">
            <Clock size={14} />
            {new Date(simState.virtual_time).toLocaleString()}
          </div>
        )}

        <button onClick={onReset} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm font-medium" title="Reset Scenario">
          <RotateCcw size={16} />
        </button>

        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600">
          <User size={16} />
        </div>
      </div>
    </div>
  );
}

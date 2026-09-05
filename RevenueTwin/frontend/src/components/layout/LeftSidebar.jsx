import React from 'react';
import { Activity, Play } from 'lucide-react';
import { SCENARIOS } from '../../config/agents';

export default function LeftSidebar({ activeScenarioDef, setActiveScenarioDef, activeRunId }) {
  return (
    <div className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-200 flex items-center gap-2">
        <Activity className="text-indigo-600" />
        <h1 className="font-bold text-slate-800 tracking-tight text-lg">RevenueTwin</h1>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        <h2 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">REVENUE LOSS</h2>
        <div className="flex flex-col gap-1">
          {SCENARIOS.map(s => {
            const Icon = s.icon;
            const active = activeScenarioDef?.id === s.id;
            // A scenario is currently running if we are on this tab AND we have an activeRunId
            const isRunning = active && activeRunId;
            
            return (
              <button
                key={s.id}
                onClick={() => setActiveScenarioDef(s)}
                className={`flex items-center gap-3 p-2 rounded text-sm transition-colors text-left relative ${active ? 'bg-indigo-100 text-indigo-800 font-medium' : 'hover:bg-slate-100 text-slate-600'}`}
              >
                <div className="relative">
                  <Icon size={16} />
                  {isRunning && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                  )}
                  {isRunning && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {s.name}
                </div>
                {!isRunning && active && (
                  <div className="w-2 h-2 rounded-full border border-slate-400"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

export default function AgentConsole({ traces, activeScenarioDef }) {
  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [traces]);

  return (
    <div className="w-[380px] bg-slate-900 text-slate-300 flex flex-col font-mono text-xs shadow-xl z-10 shrink-0">
      <div className="p-4 border-b border-slate-800">
        <h2 className="font-bold text-white uppercase tracking-widest text-sm mb-1">{activeScenarioDef?.agentName || 'AGENT CONSOLE'}</h2>
        <p className="text-slate-500 text-xs">Observing and executing revenue recovery logic.</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={terminalRef}>
        {traces.map((t, i) => {
          let colorClass = "text-slate-400";
          if (t.stage === 'EVENT') colorClass = "text-red-400";
          if (t.stage === 'DECISION') colorClass = "text-indigo-400";
          if (t.stage === 'APPROVAL') colorClass = "text-amber-400";
          if (t.stage === 'EXECUTION') colorClass = "text-emerald-400";
          if (t.stage === 'SIMULATION' || t.stage === 'OBSERVATION') colorClass = "text-cyan-400";
          if (t.stage === 'AGENT') colorClass = "text-purple-400";
          
          return (
            <div key={i} className="animate-fade-in group hover:bg-slate-800 p-1 -mx-1 rounded transition-colors">
              <div className="flex gap-2 mb-1">
                <span className="text-slate-500 font-bold">
                  {new Date(t.timestamp).toLocaleTimeString([], { hour12: false })}
                </span>
                <span className={`font-bold ${colorClass}`}>[{t.stage}]</span>
              </div>
              <div className="pl-[75px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                {t.message}
              </div>
            </div>
          );
        })}
        {traces.length === 0 && (
          <div className="text-slate-600 italic">Awaiting events...</div>
        )}
      </div>
    </div>
  );
}

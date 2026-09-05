import React from 'react';
import JourneyNode from './JourneyNode';

export default function CustomerJourney({ activeScenarioDef, run, timeline, simState }) {
  if (!activeScenarioDef) return null;

  const steps = activeScenarioDef.journeySteps;
  // If run is null, we show the static steps as pending
  
  const outcome = timeline?.outcomes?.[timeline.outcomes.length - 1];
  const isCompleted = simState?.status === 'COMPLETED';
  
  return (
    <div className="flex-1 p-8 overflow-y-auto border-r border-slate-200">
      <h2 className="text-xl font-bold mb-8 text-slate-800 tracking-tight uppercase">Customer Journey</h2>
      
      {run && (
        <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg max-w-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
              C
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Customer #C1024</h3>
              <p className="text-xs text-slate-500 font-mono">Current State: {isCompleted ? 'RESOLVED' : 'ACTIVE'}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col space-y-6">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          let status = 'PENDING';
          
          if (run) {
            status = 'COMPLETED';
            if (isLast) status = 'CURRENT'; // The event node
          }
          
          return (
            <JourneyNode 
              key={idx}
              isFirst={idx === 0}
              title={step}
              status={status}
              desc={status === 'COMPLETED' ? 'Customer completed this step.' : (status === 'CURRENT' ? 'Revenue loss event detected.' : 'Pending...')}
            />
          );
        })}
        
        {run && (
          <div className="relative pt-6">
            <div className="absolute top-0 left-5 w-px h-6 bg-slate-200"></div>
            <div className="flex items-start gap-4 p-4 rounded-lg border border-indigo-200 bg-indigo-50 shadow-sm max-w-sm">
              <div className="w-10 h-10 bg-white border border-indigo-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <activeScenarioDef.icon className="text-indigo-600" size={20} />
              </div>
              <div>
                <h4 className="font-bold text-indigo-900 text-sm tracking-tight mb-1">Agent Intervention</h4>
                <p className="text-xs text-indigo-700">The {activeScenarioDef.agentName} is currently evaluating the situation.</p>
              </div>
            </div>
          </div>
        )}
        
        {outcome && (
          <div className="relative pt-6">
            <div className="absolute top-0 left-5 w-px h-6 bg-slate-200"></div>
            <div className={`flex items-start gap-4 p-4 rounded-lg border ${outcome.status === 'SUCCESS' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-800 text-white'} shadow-sm max-w-sm`}>
              <div>
                <h4 className={`font-bold ${outcome.status === 'SUCCESS' ? 'text-emerald-900' : 'text-white'} text-sm tracking-tight mb-1`}>FINAL OUTCOME</h4>
                <p className={`text-xs ${outcome.status === 'SUCCESS' ? 'text-emerald-700' : 'text-slate-300'}`}>{outcome.status}</p>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}

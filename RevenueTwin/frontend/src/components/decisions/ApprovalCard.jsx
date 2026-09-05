import React from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ApprovalCard({ decision, isAwaitingApproval, handleApprove }) {
  if (!decision) return null;
  
  const isAuto = ["WAIT", "NO_ACTION", "CONTINUE_OBSERVATION"].includes(decision.decision);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden mb-6 animate-fade-in transition-all hover:border-indigo-200">
      <div className="bg-slate-800 text-white p-4 flex items-center justify-between">
        <h3 className="font-bold text-xs tracking-widest uppercase">Agent Recommendation</h3>
        {isAuto && <span className="bg-slate-700 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">AUTO-EXECUTING</span>}
      </div>
      
      <div className="p-6">
        <h2 className="text-2xl font-black text-indigo-700 mb-2">{decision.decision}</h2>
        <p className="text-xs text-slate-500 font-mono mb-6">Confidence: {(decision.confidence * 100).toFixed(0)}%</p>
        
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Decision Evidence</h4>
        <ul className="space-y-3 mb-6">
          {decision.reason_codes.map((r, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-700 font-medium bg-slate-50 p-2 rounded border border-slate-100">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>{r}</span>
            </li>
          ))}
          {decision.evidence?.map((e, i) => (
            <li key={`e-${i}`} className="flex gap-3 text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>{e}</span>
            </li>
          ))}
        </ul>
        
        <div className="flex items-center gap-2 mb-6 text-sm font-medium text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
          <ShieldAlert size={16} />
          POLICY PASSED
        </div>
        
        {isAwaitingApproval && !isAuto && (
          <div className="pt-4 border-t border-slate-100 flex gap-3">
            <button 
              onClick={() => handleApprove(true)} 
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm text-center shadow-sm transition-colors"
            >
              APPROVE ACTION
            </button>
            <button 
              onClick={() => handleApprove(false)} 
              className="px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-700 rounded-lg font-bold text-sm text-center transition-colors"
            >
              REJECT
            </button>
          </div>
        )}
        
        {isAuto && (
          <div className="pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500 italic text-center">Auto-executed (No intervention required)</p>
          </div>
        )}
      </div>
    </div>
  );
}

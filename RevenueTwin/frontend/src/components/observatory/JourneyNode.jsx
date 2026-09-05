import React from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

export default function JourneyNode({ isFirst, title, time, desc, status }) {
  // status: 'COMPLETED', 'CURRENT', 'PENDING'
  let Icon = Circle;
  let colorClass = "text-slate-300";
  let bgClass = "bg-white";
  let borderClass = "border-slate-200";
  
  if (status === 'COMPLETED') {
    Icon = CheckCircle2;
    colorClass = "text-emerald-500";
    borderClass = "border-emerald-200";
    bgClass = "bg-emerald-50";
  } else if (status === 'CURRENT') {
    Icon = AlertCircle;
    colorClass = "text-red-500";
    borderClass = "border-red-200";
    bgClass = "bg-red-50";
  }
  
  return (
    <div className="relative">
      {!isFirst && <div className="absolute -top-6 left-5 w-px h-6 bg-slate-200"></div>}
      <div className={`flex items-start gap-4 p-4 rounded-lg border ${borderClass} ${bgClass} shadow-sm max-w-sm transition-all hover:shadow-md cursor-pointer`}>
        <Icon className={`shrink-0 mt-0.5 ${colorClass}`} size={20} />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-slate-800 text-sm tracking-tight">{title}</h4>
            {time && <span className="text-xs text-slate-400 font-mono">{time}</span>}
          </div>
          {desc && <p className="text-xs text-slate-600">{desc}</p>}
        </div>
      </div>
    </div>
  );
}

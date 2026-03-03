import React from 'react';
import { Cloud, Wrench, Clock, BrainCircuit, ChevronRight } from 'lucide-react';

const ActionCard = ({ data, onAction, onHighlight }) => {
  const severityColors = {
    P0: 'border-red-600 bg-red-50/30',
    P1: 'border-orange-500 bg-orange-50/30',
    P2: 'border-blue-500 bg-blue-50/30'
  };

  return (
    <div 
      onClick={() => onHighlight(data.id)}
      className={`group cursor-pointer p-4 mb-3 rounded-xl border-l-4 shadow-sm transition-all hover:shadow-md bg-white 
      ${severityColors[data.priority] || 'border-slate-300'}`}>
      
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white 
            ${data.priority === 'P0' ? 'bg-red-600' : 'bg-slate-600'}`}>
            {data.priority}
          </span>
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <Clock size={12} /> {data.timestamp}
          </span>
        </div>
        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
      </div>

      <h4 className="text-sm font-bold text-slate-800 leading-tight mb-3">
        {data.title}
      </h4>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
          <Cloud size={14} className="text-slate-400" /> {data.provider}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
          <Wrench size={14} className="text-slate-400" /> {data.tool}
        </div>
      </div>

      {/* AI Recommendation Section */}
      {data.aiRecommendation && (
        <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 mb-4">
          <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-700 mb-1">
            <BrainCircuit size={14} /> AI AGENT RECOMMENDATION
          </div>
          <p className="text-[11px] text-indigo-900 italic leading-relaxed">
            "{data.aiRecommendation}"
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button 
          onClick={(e) => { e.stopPropagation(); onAction('ack', data.id); }}
          className="flex-1 py-2 text-[11px] font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
          ACKNOWLEDGE
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onAction('investigate', data.id); }}
          className="flex-1 py-2 text-[11px] font-bold border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
          INVESTIGATE
        </button>
      </div>
    </div>
  );
};

export default ActionCard;

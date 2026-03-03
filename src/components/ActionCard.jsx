import React, { useState } from 'react';
import { Cloud, Wrench, Clock, BrainCircuit, ChevronRight, StickyNote, Plus, Send } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';

const ActionCard = ({ data, onAction, onHighlight }) => {
  const [noteOpen, setNoteOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const { annotations, addAnnotation } = useDashboardStore();
  const notes = annotations[data.id] ?? [];

  const severityColors = {
    P0: 'border-red-600 bg-red-50/30',
    P1: 'border-orange-500 bg-orange-50/30',
    P2: 'border-blue-500 bg-blue-50/30',
  };

  const handleSave = (e) => {
    e.stopPropagation();
    const trimmed = draft.trim();
    if (!trimmed) return;
    addAnnotation(data.id, trimmed);
    setDraft('');
    setNoteOpen(false);
  };

  return (
    <div
      onClick={() => onHighlight(data.id)}
      className={`group cursor-pointer p-4 mb-3 rounded-xl border-l-4 shadow-sm transition-all hover:shadow-md bg-white
      ${severityColors[data.priority] || 'border-slate-300'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white
            ${data.priority === 'P0' ? 'bg-red-600' : data.priority === 'P1' ? 'bg-orange-500' : 'bg-blue-500'}`}>
            {data.priority}
          </span>
          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <Clock size={12} /> {data.timestamp}
          </span>
        </div>
        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
      </div>

      <h4 className="text-sm font-bold text-slate-800 leading-tight mb-3">{data.title}</h4>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
          <Cloud size={14} className="text-slate-400" /> {data.provider}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
          <Wrench size={14} className="text-slate-400" /> {data.tool}
        </div>
        {data.causedBy && (
          <div className="ml-auto flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            ↳ cascade
          </div>
        )}
      </div>

      {/* AI Recommendation */}
      {data.aiRecommendation && (
        <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 mb-3">
          <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-700 mb-1">
            <BrainCircuit size={14} /> AI AGENT RECOMMENDATION
          </div>
          <p className="text-[11px] text-indigo-900 italic leading-relaxed">"{data.aiRecommendation}"</p>
        </div>
      )}

      {/* Existing annotations */}
      {notes.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {notes.map((note, i) => (
            <div key={i} className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
              <StickyNote size={11} className="text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-slate-700 leading-snug">{note.text}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{note.ts}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add note inline form */}
      {noteOpen ? (
        <div className="mb-3" onClick={e => e.stopPropagation()}>
          <textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSave(e); }}
            placeholder="Add investigation note… (Enter to save)"
            className="w-full text-[11px] p-2.5 rounded-lg border border-amber-300 bg-amber-50 text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
            rows={2}
          />
          <div className="flex justify-end gap-2 mt-1.5">
            <button
              onClick={e => { e.stopPropagation(); setNoteOpen(false); setDraft(''); }}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-2 py-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1 text-[10px] font-bold bg-amber-500 text-white px-3 py-1 rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Send size={10} /> Save
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={e => { e.stopPropagation(); setNoteOpen(true); }}
          className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-amber-600 transition-colors mb-3"
        >
          <Plus size={11} /><StickyNote size={11} /> Add note
        </button>
      )}

      <div className="flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onAction('ack', data.id); }}
          className="flex-1 py-2 text-[11px] font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          ACKNOWLEDGE
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onAction('investigate', data.id); }}
          className="flex-1 py-2 text-[11px] font-bold border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          INVESTIGATE
        </button>
      </div>
    </div>
  );
};

export default ActionCard;

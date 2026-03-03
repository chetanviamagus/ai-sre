import React, { useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import ActionCard from './ActionCard';
import { Flame, Microscope, Inbox, GitBranch, ChevronRight } from 'lucide-react';

// ── Timeline cascade tree ─────────────────────────────────────────────────────
const P_COLOR = {
  P0: { dot: 'bg-red-600',    text: 'text-red-600',    badge: 'bg-red-600'    },
  P1: { dot: 'bg-orange-500', text: 'text-orange-500', badge: 'bg-orange-500' },
  P2: { dot: 'bg-blue-500',   text: 'text-blue-500',   badge: 'bg-blue-500'   },
};

const TimelineNode = ({ inc, children = [], allIncidents, onHighlight, depth = 0 }) => {
  const [expanded, setExpanded] = useState(true);
  const pc = P_COLOR[inc.priority] ?? P_COLOR.P2;
  const isRoot = !inc.causedBy;

  return (
    <div className={depth > 0 ? 'ml-5 border-l-2 border-slate-100 pl-3' : ''}>
      <div
        className={`flex items-start gap-2 p-2.5 rounded-xl mb-1.5 cursor-pointer transition-colors
          ${isRoot ? 'bg-red-50/60 border border-red-100' : 'bg-white border border-slate-100 hover:bg-slate-50'}`}
        onClick={() => onHighlight(inc.id)}
      >
        {/* Timeline dot */}
        <div className="flex flex-col items-center shrink-0 mt-1">
          <div className={`w-2.5 h-2.5 rounded-full ${pc.dot} ${isRoot ? 'ring-2 ring-red-300' : ''}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full text-white ${pc.badge}`}>
              {inc.priority}
            </span>
            {isRoot && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-600 text-white">
                ROOT CAUSE
              </span>
            )}
            {inc.causedBy && (
              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                ↳ cascade
              </span>
            )}
            <span className="text-[10px] text-slate-400 ml-auto">{inc.timestamp}</span>
          </div>
          <p className="text-[11px] font-semibold text-slate-800 leading-tight">{inc.title}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{inc.tool} · {inc.provider}</p>
        </div>

        {children.length > 0 && (
          <button
            onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
            className="shrink-0 text-slate-400 hover:text-slate-600 mt-1"
          >
            <ChevronRight size={13} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        )}
      </div>

      {expanded && children.map(child => (
        <TimelineNode
          key={child.id}
          inc={child}
          children={(allIncidents.filter(i => i.causedBy === child.id))}
          allIncidents={allIncidents}
          onHighlight={onHighlight}
          depth={depth + 1}
        />
      ))}
    </div>
  );
};

const TimelineView = ({ incidents, onHighlight }) => {
  // Build cascade tree: roots = no causedBy
  const roots  = incidents.filter(i => !i.causedBy).sort((a, b) => b.tsOffset - a.tsOffset);
  const getChildren = (id) => incidents.filter(i => i.causedBy === id);

  if (incidents.length === 0) {
    return <EmptyState message="No incidents to display" />;
  }

  return (
    <div className="space-y-1">
      {/* Time axis header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Cascade Timeline</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {roots.map(root => (
        <TimelineNode
          key={root.id}
          inc={root}
          children={getChildren(root.id)}
          allIncidents={incidents}
          onHighlight={onHighlight}
          depth={0}
        />
      ))}

      {/* Orphan incidents (causedBy set but parent not visible) */}
      {incidents
        .filter(i => i.causedBy && !incidents.find(r => r.id === i.causedBy))
        .map(inc => (
          <TimelineNode
            key={inc.id}
            inc={inc}
            children={getChildren(inc.id)}
            allIncidents={incidents}
            onHighlight={onHighlight}
            depth={0}
          />
        ))
      }
    </div>
  );
};

// ── BucketContainer ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'incidents',      label: 'Incidents',      Icon: Flame,       color: 'text-red-500'    },
  { id: 'timeline',       label: 'Timeline',       Icon: GitBranch,   color: 'text-amber-500'  },
  { id: 'investigations', label: 'Investigations', Icon: Microscope,  color: 'text-indigo-500' },
];

const BucketContainer = () => {
  const [activeTab, setActiveTab] = useState('incidents');
  const { getFilteredData, highlightIncident } = useDashboardStore();
  const { incidents, investigations } = getFilteredData();

  const counts = { incidents: incidents.length, timeline: incidents.length, investigations: investigations.length };

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-xl">
        {TABS.map(({ id, label, Icon, color }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${
              activeTab === id
                ? 'bg-white shadow-sm text-slate-800'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon size={11} className={activeTab === id ? color : ''} />
            {label}
            {counts[id] > 0 && (
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                activeTab === id ? 'bg-slate-100 text-slate-500' : 'bg-slate-200 text-slate-400'
              }`}>
                {counts[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto pr-1">
        {activeTab === 'incidents' && (
          incidents.length > 0
            ? incidents.map(inc => (
                <ActionCard key={inc.id} data={inc} onHighlight={highlightIncident} onAction={(type, id) => console.log(type, id)} />
              ))
            : <EmptyState message="No active incidents for this filter" />
        )}

        {activeTab === 'timeline' && (
          <TimelineView incidents={incidents} onHighlight={highlightIncident} />
        )}

        {activeTab === 'investigations' && (
          investigations.length > 0
            ? investigations.map(inv => (
                <ActionCard key={inv.id} data={inv} onHighlight={() => {}} onAction={(type, id) => console.log(type, id)} />
              ))
            : <EmptyState message="No open investigations" />
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
    <Inbox className="text-slate-300 mb-3" size={32} />
    <p className="text-slate-400 text-xs font-medium">{message}</p>
  </div>
);

export default BucketContainer;

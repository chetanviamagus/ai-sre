import React from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { X, BookOpen, Activity, ExternalLink, Layers, Cpu, Globe, Hexagon, Zap } from 'lucide-react';

const LEVEL_ICON = { 0: Globe, 1: Layers, 2: Hexagon, 3: Cpu, 4: Zap };

const HEALTH_STYLE = {
  Critical: { bar: 'bg-red-500',    badge: 'bg-red-50 text-red-600 border-red-200'    },
  Warning:  { bar: 'bg-yellow-500', badge: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  Healthy:  { bar: 'bg-emerald-500',badge: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
};

const TYPE_LABEL = {
  clusterNode: 'Cluster', subClusterNode: 'Namespace',
  groupNode: 'Workload Group', serviceNode: 'Service',
};

const NodePanel = () => {
  const { selectedNodeId, allNodes, allIncidents, setSelection } = useDashboardStore(s => ({
    selectedNodeId: s.selectedNodeId,
    allNodes:       s.allNodes,
    allIncidents:   s.allIncidents,
    setSelection:   s.setSelection,
  }));

  if (!selectedNodeId) return null;

  const node = allNodes.find(n => n.id === selectedNodeId);
  if (!node) return null;

  const hs      = HEALTH_STYLE[node.data.health] ?? HEALTH_STYLE.Healthy;
  const LvlIcon = LEVEL_ICON[node.level] ?? Zap;
  const activeIncidents = allIncidents.filter(
    i => i.serviceId === selectedNodeId && i.status !== 'Resolved'
  );
  const runbook = node.data.runbook;

  return (
    <div className="flex items-stretch gap-0 bg-white border border-slate-200 rounded-xl shadow-md mb-3 overflow-hidden">
      {/* Health accent bar */}
      <div className={`w-1 shrink-0 ${hs.bar}`} />

      <div className="flex-1 flex items-center gap-4 px-4 py-3 min-w-0">
        {/* Icon + name */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-slate-100 rounded-lg shrink-0">
            <LvlIcon size={16} className="text-slate-600" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-slate-800 truncate leading-tight">{node.data.label}</div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
              L{node.level} · {TYPE_LABEL[node.type] ?? 'node'}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-slate-100 shrink-0" />

        {/* Health */}
        <div className="shrink-0">
          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Health</div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${hs.badge}`}>
            {node.data.health}
          </span>
        </div>

        {/* Latency */}
        {node.data.latency && (
          <>
            <div className="h-8 w-px bg-slate-100 shrink-0" />
            <div className="shrink-0">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Latency</div>
              <span className="text-[11px] font-black text-slate-700 font-mono">{node.data.latency}</span>
            </div>
          </>
        )}

        {/* Active incidents */}
        {activeIncidents.length > 0 && (
          <>
            <div className="h-8 w-px bg-slate-100 shrink-0" />
            <div className="shrink-0">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Incidents</div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[11px] font-black text-red-600">{activeIncidents.length} active</span>
              </div>
            </div>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Runbook link */}
        {runbook ? (
          <a
            href={runbook}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1.5 text-[10px] font-black px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shrink-0"
          >
            <BookOpen size={12} /> Runbook <ExternalLink size={10} />
          </a>
        ) : (
          <div className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-2 bg-slate-50 text-slate-300 rounded-lg border border-slate-100 shrink-0 cursor-not-allowed">
            <BookOpen size={12} /> No runbook
          </div>
        )}

        {/* Active incidents quick-view */}
        {activeIncidents.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] font-black px-3 py-2 bg-red-50 text-red-600 rounded-lg border border-red-100 shrink-0">
            <Activity size={12} className="animate-pulse" />
            {activeIncidents[0].priority}: {activeIncidents[0].title.slice(0, 30)}…
          </div>
        )}

        {/* Close */}
        <button
          onClick={() => setSelection(null)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          title="Clear selection"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default NodePanel;

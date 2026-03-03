import React from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { Layers, Clock, Cloud, Wrench, ShieldAlert, User, RotateCcw, ArrowLeft } from 'lucide-react';

const FilterBar = () => {
  const { filters, setFilter, projects, reset, drillUp, currentParentId, allNodes } = useDashboardStore();

  const currentParent = currentParentId ? allNodes.find(n => n.id === currentParentId) : null;

  const FilterGroup = ({ label, icon: Icon, value, options, onChange }) => (
    <div className="flex flex-col gap-1.5 min-w-[140px]">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <Icon size={12} /> {label}
      </div>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 transition-all hover:bg-slate-50">
        {options.map(opt => <option key={opt.id || opt} value={opt.id || opt}>{opt.name || opt}</option>)}
      </select>
    </div>
  );

  return (
    <div className="flex flex-wrap items-center gap-6 p-6 bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-4 border-r border-slate-100 pr-6">
        <button 
          onClick={reset}
          className="p-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 text-xs font-bold"
          title="Reset Dashboard"
        >
          <RotateCcw size={16} /> RESET
        </button>
        
        {currentParentId && (
          <button 
            onClick={drillUp}
            className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2 text-xs font-bold"
          >
            <ArrowLeft size={16} /> BACK
          </button>
        )}
      </div>

      <FilterGroup 
        label="Project" icon={Layers} value={filters.projectId} 
        options={projects} onChange={(val) => setFilter('projectId', val)} 
      />
      
      {currentParent && (
        <div className="flex flex-col gap-1.5 px-5 py-2.5 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden group/context">
          <div className="absolute top-0 right-0 p-1 opacity-10 group-hover/context:opacity-30 transition-opacity">
            <Layers size={24} className="text-indigo-500" />
          </div>
          <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> 
            LEVEL {currentParent.level} CONTEXT
          </div>
          <div className="text-sm font-black text-indigo-900 tracking-tight leading-none">{currentParent.data.label}</div>
        </div>
      )}

      <FilterGroup 
        label="Time Range" icon={Clock} value={filters.timeRange} 
        options={['Today', 'Last 1h', 'Last 24h', 'Last 7d']} onChange={(val) => setFilter('timeRange', val)} 
      />
      <FilterGroup 
        label="Cloud Provider" icon={Cloud} value={filters.provider} 
        options={['All', 'AWS', 'GCP', 'Azure']} onChange={(val) => setFilter('provider', val)} 
      />
      <FilterGroup 
        label="Tool" icon={Wrench} value={filters.tool} 
        options={['All', 'Datadog', 'Prometheus', 'New Relic']} onChange={(val) => setFilter('tool', val)} 
      />
      <FilterGroup 
        label="Severity" icon={ShieldAlert} value={filters.severity} 
        options={['All', 'P0', 'P1', 'P2']} onChange={(val) => setFilter('severity', val)} 
      />
      <FilterGroup 
        label="Ticket Owner" icon={User} value={filters.owner} 
        options={['All', 'My Team', 'Unassigned']} onChange={(val) => setFilter('owner', val)} 
      />
    </div>
  );
};

export default FilterBar;

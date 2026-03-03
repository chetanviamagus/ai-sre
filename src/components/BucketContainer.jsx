import React from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import ActionCard from './ActionCard';
import { Flame, Microscope, Inbox } from 'lucide-react';

const BucketContainer = () => {
  const { getFilteredData, highlightIncident } = useDashboardStore();
  const { incidents, investigations } = getFilteredData();

  const BucketHeader = ({ title, icon: Icon, count, color }) => (
    <div className="flex items-center justify-between mb-4 px-2">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${color} bg-opacity-10`}>
          <Icon size={18} className={color.replace('bg-', 'text-')} />
        </div>
        <h3 className="font-bold text-slate-800 tracking-tight">{title}</h3>
      </div>
      <span className="bg-slate-100 text-slate-500 text-[11px] font-bold px-2 py-0.5 rounded-full">
        {count}
      </span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Bucket 1: Incidents & Alerts */}
      <div className="flex flex-col h-full">
        <BucketHeader title="Incidents & Alerts" icon={Flame} count={incidents.length} color="bg-red-500" />
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {incidents.length > 0 ? (
            incidents.map(inc => (
              <ActionCard key={inc.id} data={inc} onHighlight={highlightIncident} onAction={(type, id) => console.log(type, id)} />
            ))
          ) : (
            <EmptyState message="No active incidents for this filter" />
          )}
        </div>
      </div>

      {/* Bucket 2: Investigations */}
      <div className="flex flex-col h-full border-l border-slate-100 pl-4">
        <BucketHeader title="Investigations" icon={Microscope} count={investigations.length} color="bg-indigo-500" />
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {investigations.map(inv => (
            <ActionCard key={inv.id} data={inv} onHighlight={() => {}} onAction={(type, id) => console.log(type, id)} />
          ))}
        </div>
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

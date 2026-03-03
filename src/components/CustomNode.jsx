import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  Activity, AlertTriangle, CheckCircle, XCircle, Search, 
  Cloud, Box, Cpu, HardDrive, Zap, Globe, Layers, Hexagon, Boxes
} from 'lucide-react';

const CustomNode = ({ data, type, level }) => {
  const isCritical = data.health === 'Critical';
  const isWarning = data.health === 'Warning';
  const isHealthy = data.health === 'Healthy';

  const isCluster = type === 'clusterNode' || type === 'subClusterNode' || type === 'groupNode';
  
  // Abstraction-based Icons
  const LevelIcon = () => {
    const size = isCluster ? 24 : 18;
    if (level === 0) return <Globe size={size} />;
    if (level === 1) return <Layers size={size} />;
    if (level === 2) return <Hexagon size={size} />;
    if (level === 3) return <Cpu size={size} />;
    return <Zap size={size} />;
  };

  // Abstract styling based on level
  const abstractStyles = {
    0: 'bg-indigo-900/5 border-indigo-200 border-double shadow-xl min-w-[220px] scale-110', // Cluster: Very Abstract
    1: 'bg-blue-900/5 border-blue-200 border-dashed shadow-lg min-w-[200px] scale-105',     // Namespace: Abstract
    2: 'bg-slate-50 border-slate-300 border-dashed shadow-md min-w-[180px]',              // Group/Workload: Semi-Abstract
    3: 'bg-white border-slate-200 border-solid shadow-sm min-w-[150px]',                  // Service: Concrete
    4: 'bg-white border-slate-200 border-solid shadow-sm min-w-[130px] scale-95',         // Pod: Most Concrete
  };

  const currentStyle = abstractStyles[level] || abstractStyles[2];

  return (
    <div 
      className={`px-5 py-4 rounded-2xl border-2 transition-all duration-500 group relative
      ${data.isDimmed ? 'opacity-30 scale-90 blur-[1px]' : 'opacity-100'}
      ${isCritical ? 'border-red-500/50 shadow-red-100/50' : isWarning ? 'border-yellow-500/50 shadow-yellow-100/50' : 'border-emerald-500/50 shadow-emerald-100/50'}
      ${currentStyle}
      ${isCluster ? 'cursor-pointer hover:border-indigo-500 hover:shadow-indigo-100' : ''}`}>
      
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-slate-300 border-none" />
      
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className={`p-2.5 rounded-xl transition-all duration-300
            ${isCritical ? 'bg-red-50 text-red-600' : isWarning ? 'bg-yellow-50 text-yellow-600' : 'bg-emerald-50 text-emerald-600'}
            ${isCluster ? 'group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white' : ''}`}>
            <LevelIcon />
          </div>
          
          <div className="flex items-center gap-1.5">
            {isCritical ? <XCircle size={14} className="text-red-500 animate-pulse" /> : isWarning ? <AlertTriangle size={14} className="text-yellow-500" /> : <CheckCircle size={14} className="text-emerald-500" />}
            <span className={`text-[9px] font-black uppercase tracking-tighter ${isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-emerald-600'}`}>
              {data.health}
            </span>
          </div>
        </div>
        
        <div className="flex-1">
          <div className={`font-black text-slate-800 transition-colors leading-tight tracking-tight
            ${level <= 1 ? 'text-lg group-hover:text-indigo-700' : 'text-sm'}`}>
            {data.label}
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="text-[8px] uppercase tracking-[0.2em] font-bold text-slate-400">
              LEVEL {level} — {type.replace('Node', '')}
            </div>
            {!isCluster && (
              <div className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                {data.latency || '24ms'}
              </div>
            )}
          </div>
        </div>

        {isCluster && (
          <div className="absolute bottom-3 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <div className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">DRILL IN</div>
            <Search size={12} className="text-indigo-500" />
          </div>
        )}
      </div>

      {data.hasActiveIncident && (
        <div className="absolute -top-2 -right-2 flex h-5 w-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 border-2 border-white shadow-sm flex items-center justify-center">
            <Activity size={10} className="text-white" />
          </span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-slate-300 border-none" />
    </div>
  );
};

export default memo(CustomNode);

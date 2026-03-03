import React, { useEffect, useState } from 'react';
import FilterBar from './components/FilterBar';
import ServiceMap from './components/ServiceMap';
import BucketContainer from './components/BucketContainer';
import NodePanel from './components/NodePanel';
import { useDashboardStore } from './store/useDashboardStore';
import { Search, Bell, Settings, BarChart3, TrendingUp, DollarSign, Network, GitMerge, Table, Layers, Maximize2, Minimize2 } from 'lucide-react';

const App = () => {
  const {
    currentRole, roles, setRole, addIncident, getFilteredData,
    currentParentId, allNodes, overviewLevel, setOverviewLevel,
    reset, drillTo, viewMode, setViewMode
  } = useDashboardStore();

  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  const { isExecutive } = getFilteredData();

  const currentParent = currentParentId ? allNodes.find(n => n.id === currentParentId) : null;
  const breadcrumbs = [];
  if (currentParent) {
    let p = currentParent;
    while (p) {
      breadcrumbs.unshift(p);
      p = p.parentId ? allNodes.find(n => n.id === p.parentId) : null;
    }
  }

  // ESC to exit fullscreen
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setIsMapFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Mock Real-time Update Effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate a random new incident every 30 seconds
      if (Math.random() > 0.7) {
        addIncident({
          id: `inc-${Date.now()}`,
          projectId: 'p1',
          serviceId: 'n3',
          priority: 'P1',
          title: 'Memory Leak detected in Stripe-Gateway',
          provider: 'AWS',
          tool: 'Prometheus',
          status: 'To Do',
          aiRecommendation: 'Heuristic analysis suggests rolling back commit #d4f21.',
          timestamp: 'Just now'
        });
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [addIncident]);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <div className="w-16 bg-slate-900 flex flex-col items-center py-6 gap-8 text-slate-400 border-r border-slate-800">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-900/20">AI</div>
        <div className="flex flex-col gap-6">
          <Search size={20} className="hover:text-white cursor-pointer transition-colors" />
          <BarChart3 size={20} className="hover:text-white cursor-pointer transition-colors" />
          <Bell size={20} className="hover:text-white cursor-pointer transition-colors" />
        </div>
        <div className="mt-auto flex flex-col gap-6">
          <Settings size={20} className="hover:text-white cursor-pointer transition-colors mb-4" />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-black tracking-tight text-slate-800">SRE <span className="text-indigo-600">AGENT</span> DASHBOARD</h1>
            <div className="h-6 w-[1px] bg-slate-200 mx-2" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role:</span>
              <select 
                value={currentRole}
                onChange={(e) => setRole(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-slate-100 border-none rounded-full px-4 py-1.5 focus:ring-0 cursor-pointer hover:bg-slate-200 transition-colors">
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-800">System Status</span>
              <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> 99.98% Uptime
              </span>
            </div>
            <div className="h-8 w-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600">JS</div>
          </div>
        </header>

        {/* Filters */}
        <FilterBar />

        {/* Breadcrumbs */}
        <div className="px-8 py-3 bg-white border-b border-slate-100 flex items-center gap-2">
          <button
            title="Root"
            onClick={reset}
            className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-colors ${
              breadcrumbs.length === 0
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            L0
          </button>
          {breadcrumbs.map((node, i) => (
            <React.Fragment key={node.id}>
              <span className="text-slate-300 text-xs">›</span>
              <button
                title={node.data.label}
                onClick={() => drillTo(node.id)}
                className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-colors ${
                  i === breadcrumbs.length - 1
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                L{i + 1}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col p-8 gap-8 overflow-y-auto bg-slate-50/50">
          
          {/* Executive Section (Conditional) */}
          {isExecutive && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><TrendingUp size={24} /></div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. ROI (MTTR Reduction)</div>
                  <div className="text-2xl font-black text-slate-800">$12,400 <span className="text-xs text-emerald-500 font-bold">+12%</span></div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><DollarSign size={24} /></div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cloud Cost Optimization</div>
                  <div className="text-2xl font-black text-slate-800">$3,200 <span className="text-xs text-indigo-500 font-bold">SAVED</span></div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-red-50 rounded-xl text-red-600"><BarChart3 size={24} /></div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Impact Avoidance</div>
                  <div className="text-2xl font-black text-slate-800">4.2h <span className="text-xs text-red-500 font-bold">DOWNTIME SAVED</span></div>
                </div>
              </div>
            </section>
          )}

          <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
            {/* Left: Service Map */}
            <section className={
              isMapFullscreen
                ? 'fixed inset-0 z-50 flex flex-col bg-slate-50 p-6'
                : 'flex-[3] flex flex-col min-h-[400px]'
            }>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Project Service Topology</h2>
                <div className="flex items-center gap-4 text-[11px] font-bold">
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Healthy</span>
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500" /> Warning</span>
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
                  <button
                    onClick={() => setIsMapFullscreen(f => !f)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 text-slate-500 transition-colors"
                    title={isMapFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
                  >
                    {isMapFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </button>
                </div>
              </div>

              {/* Breadcrumb (fullscreen only) */}
              {isMapFullscreen && (
                <div className="flex items-center gap-2 mb-3 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <button
                    title="Root"
                    onClick={reset}
                    className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-colors ${
                      breadcrumbs.length === 0
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    L0
                  </button>
                  {breadcrumbs.map((node, i) => (
                    <React.Fragment key={node.id}>
                      <span className="text-slate-300 text-xs">›</span>
                      <button
                        title={node.data.label}
                        onClick={() => drillTo(node.id)}
                        className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-colors ${
                          i === breadcrumbs.length - 1
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        L{i + 1}
                      </button>
                      <span className="text-[10px] text-slate-400 font-medium">{node.data.label}</span>
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">Layout:</span>
                {[
                  { mode: 'force',   label: 'Force',   Icon: Network   },
                  { mode: 'tree',    label: 'Tree',    Icon: GitMerge  },
                  { mode: 'table',   label: 'Table',   Icon: Table     },
                  { mode: 'cluster', label: 'Cluster', Icon: Layers    },
                ].map(({ mode, label, Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full transition-colors ${
                      viewMode === mode
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <Icon size={11} />{label}
                  </button>
                ))}
              </div>

              {/* Level Overview Buttons */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">View All:</span>
                {[0, 1, 2, 3, 4].map(level => (
                  <button
                    key={level}
                    onClick={() => overviewLevel === level ? setOverviewLevel(null) : setOverviewLevel(level)}
                    className={`text-[10px] font-black px-3 py-1.5 rounded-full transition-colors ${
                      overviewLevel === level
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    L{level}
                  </button>
                ))}
                {overviewLevel !== null && (
                  <span className="text-[10px] text-slate-400 font-medium ml-1">
                    — click any node to drill in
                  </span>
                )}
              </div>

              <NodePanel />
              <ServiceMap key={isMapFullscreen ? 'fs' : 'normal'} />
            </section>

            {/* Right: Buckets (hidden in fullscreen) */}
            {!isMapFullscreen && (
              <section className="flex-[2] min-h-0">
                <BucketContainer />
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;

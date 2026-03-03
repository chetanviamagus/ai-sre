import { create } from 'zustand';
import { MOCK_DATA } from '../data/mockData';

export const useDashboardStore = create((set, get) => {
  // Helper to compute filtered data
  const computeFilteredData = (state) => {
    const { filters, allIncidents, allInvestigations, allNodes, allEdges, selectedNodeId, currentRole, currentParentId, overviewLevel } = state;

    // Role-based visibility
    const isExecutive = ['VP', 'CEO/CTO'].includes(currentRole);
    const isManagement = ['Manager', 'Director'].includes(currentRole) || isExecutive;

    // 1. Filter Incidents
    let filteredIncidents = allIncidents.filter(inc => {
      const matchProject = inc.projectId === filters.projectId;
      const matchSeverity = filters.severity === 'All' || inc.priority === filters.severity;
      const matchProvider = filters.provider === 'All' || inc.provider === filters.provider;
      const matchTool = filters.tool === 'All' || inc.tool === filters.tool;
      return matchProject && matchSeverity && matchProvider && matchTool;
    });

    if (currentParentId) {
      const childServiceIds = allNodes
        .filter(n => {
          let parent = n.parentId;
          while (parent) {
            if (parent === currentParentId) return true;
            parent = allNodes.find(p => p.id === parent)?.parentId;
          }
          return false;
        })
        .map(n => n.id);

      filteredIncidents = filteredIncidents.filter(inc =>
        inc.serviceId === currentParentId || childServiceIds.includes(inc.serviceId)
      );
    }

    if (selectedNodeId) {
      filteredIncidents = filteredIncidents.filter(inc => inc.serviceId === selectedNodeId);
    }

    // 2. Filter Investigations
    const filteredInvestigations = allInvestigations.filter(inv =>
      inv.projectId === filters.projectId &&
      (filters.severity === 'All' || inv.priority === filters.severity)
    );

    // Recursive check: does this node or any descendant have an active incident?
    const hasIncidentInSubtree = (nodeId) => {
      if (allIncidents.some(i => i.serviceId === nodeId && i.status !== 'Resolved')) return true;
      const children = allNodes.filter(n => n.parentId === nodeId);
      return children.some(child => hasIncidentInSubtree(child.id));
    };

    // 3a. OVERVIEW MODE — show all nodes at a specific level across all branches
    if (overviewLevel !== null) {
      const overviewNodes = allNodes
        .filter(n => n.projectId === filters.projectId && n.level === overviewLevel)
        .map((node, idx) => {
          const col = idx % 4;
          const row = Math.floor(idx / 4);
          return {
            ...node,
            position: { x: col * 300, y: row * 170 },
            data: {
              ...node.data,
              isDimmed: false,
              hasActiveIncident: hasIncidentInSubtree(node.id),
            }
          };
        });

      const overviewNodeIds = new Set(overviewNodes.map(n => n.id));
      return {
        incidents: filteredIncidents,
        investigations: filteredInvestigations,
        nodes: overviewNodes,
        edges: allEdges.filter(e => overviewNodeIds.has(e.source) && overviewNodeIds.has(e.target)),
        isExecutive,
        isManagement
      };
    }

    // 3b. NORMAL DRILL-DOWN MODE
    const filteredNodes = allNodes
      .filter(node => node.projectId === filters.projectId && (node.parentId || null) === currentParentId)
      .map(node => ({
        ...node,
        data: {
          ...node.data,
          isDimmed: selectedNodeId ? node.id !== selectedNodeId : false,
          hasActiveIncident: hasIncidentInSubtree(node.id),
        }
      }));

    return {
      incidents: filteredIncidents,
      investigations: filteredInvestigations,
      nodes: filteredNodes,
      edges: allEdges.filter(edge => filteredNodes.some(n => n.id === edge.source) && filteredNodes.some(n => n.id === edge.target)),
      isExecutive,
      isManagement
    };
  };

  return {
    // --- RAW DATA ---
    projects: MOCK_DATA.projects,
    allIncidents: MOCK_DATA.incidents,
    allInvestigations: MOCK_DATA.investigations,
    allNodes: MOCK_DATA.nodes,
    allEdges: MOCK_DATA.edges,

    // --- ROLE & USER STATE ---
    currentRole: 'Senior Level SRE',
    roles: ['Entry Level SRE', 'Senior Level SRE', 'Lead', 'Incident Commander', 'Manager', 'Director', 'VP', 'CEO/CTO'],

    // --- ACTIVE FILTERS ---
    filters: {
      projectId: 'p1',
      timeRange: 'Today',
      provider: 'All',
      tool: 'All',
      severity: 'All',
      owner: 'All',
    },
    
    // --- SELECTIONS & DRILL-DOWN ---
    currentLevel: 0,
    currentParentId: null,
    selectedNodeId: null,
    selectedIncidentId: null,
    overviewLevel: null,

    // --- ACTIONS ---
    setRole: (role) => {
      set({ currentRole: role, selectedNodeId: null, selectedIncidentId: null });
    },

    setFilter: (key, value) => {
      set((state) => {
        const nextFilters = { ...state.filters, [key]: value };
        // If project changes, reset the drill-down and overview state to avoid blank pages
        if (key === 'projectId') {
          return { 
            filters: nextFilters, 
            selectedNodeId: null,
            currentParentId: null,
            currentLevel: 0,
            overviewLevel: null,
            selectedIncidentId: null
          };
        }
        return { filters: nextFilters, selectedNodeId: null };
      });
    },

    setOverviewLevel: (level) => {
      set({
        overviewLevel: level,
        currentParentId: null,
        currentLevel: 0,
        selectedNodeId: null,
        selectedIncidentId: null,
      });
    },

    setSelection: (nodeId) => {
      const state = get();
      const node = state.allNodes.find(n => n.id === nodeId);
      if (!node) return;

      const hasChildren = state.allNodes.some(n => n.parentId === nodeId);

      if (hasChildren) {
        set({
          overviewLevel: null,
          currentLevel: (node.level || 0) + 1,
          currentParentId: nodeId,
          selectedNodeId: null,
          selectedIncidentId: null
        });
      } else {
        set({
          selectedNodeId: nodeId,
          selectedIncidentId: null
        });
      }
    },

    drillTo: (nodeId) => {
      const state = get();
      const node = state.allNodes.find(n => n.id === nodeId);
      if (!node) return;
      set({
        overviewLevel: null,
        currentLevel: (node.level || 0) + 1,
        currentParentId: nodeId,
        selectedNodeId: null,
        selectedIncidentId: null
      });
    },

    drillUp: () => {
      const state = get();
      if (state.currentParentId === null) return;

      const parentNode = state.allNodes.find(n => n.id === state.currentParentId);
      set({
        currentLevel: parentNode.level || 0,
        currentParentId: parentNode.parentId || null,
        selectedNodeId: null
      });
    },

    reset: () => set({
      filters: {
        projectId: 'p1',
        timeRange: 'Today',
        provider: 'All',
        tool: 'All',
        severity: 'All',
        owner: 'All',
      },
      overviewLevel: null,
      currentLevel: 0,
      currentParentId: null,
      selectedNodeId: null,
      selectedIncidentId: null
    }),

    highlightIncident: (incidentId) => {
      const state = get();
      const incident = state.allIncidents.find(i => i.id === incidentId);
      if (!incident) return;

      const serviceNode = state.allNodes.find(n => n.id === incident.serviceId);
      if (serviceNode) {
        set({
          overviewLevel: null,
          currentLevel: serviceNode.level,
          currentParentId: serviceNode.parentId,
          selectedNodeId: serviceNode.id,
          selectedIncidentId: incidentId
        });
      }
    },

    addIncident: (incident) => set((state) => ({
      allIncidents: [incident, ...state.allIncidents]
    })),

    // --- SELECTOR ---
    getFilteredData: () => computeFilteredData(get())
  };
});

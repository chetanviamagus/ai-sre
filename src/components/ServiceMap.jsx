import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useDashboardStore } from '../store/useDashboardStore';

// ── Visual constants ────────────────────────────────────────────────────────
const SZ = [
  { w: 200, h: 68, r: 14 }, // L0 – cluster
  { w: 184, h: 62, r: 12 }, // L1 – namespace
  { w: 168, h: 58, r: 10 }, // L2 – group
  { w: 154, h: 54, r: 9  }, // L3 – service
  { w: 140, h: 48, r: 8  }, // L4 – pod/instance
];

const HEALTH = {
  Critical: { stroke: '#ef4444', fill: '#fef2f2', dot: '#dc2626' },
  Warning:  { stroke: '#f59e0b', fill: '#fffbeb', dot: '#d97706' },
  Healthy:  { stroke: '#10b981', fill: '#f0fdf4', dot: '#059669' },
};

const LEVEL_BG   = ['#eef2ff', '#eff6ff', '#f8fafc', '#ffffff', '#ffffff'];
const TYPE_LABEL = {
  clusterNode: 'cluster', subClusterNode: 'namespace',
  groupNode: 'group',     serviceNode: 'service',
};

// ── Component ───────────────────────────────────────────────────────────────
const ServiceMap = () => {
  const svgRef       = useRef(null);
  const containerRef = useRef(null);
  const simRef       = useRef(null);

  const { getFilteredData, setSelection, currentParentId, overviewLevel } = useDashboardStore();
  const { nodes, edges } = getFilteredData();

  useEffect(() => {
    const container = containerRef.current;
    const svgEl     = svgRef.current;
    if (!container || !svgEl) return;

    const W = container.clientWidth  || 800;
    const H = container.clientHeight || 500;

    // Stop and discard previous simulation
    if (simRef.current) simRef.current.stop();

    // ── SVG setup ──────────────────────────────────────────────────────────
    const svg = d3.select(svgEl).attr('width', W).attr('height', H);
    svg.selectAll('*').remove();

    // Defs: arrowhead + shadows
    const defs = svg.append('defs');

    // Arrowhead markers: default (gray), outgoing (indigo), incoming (emerald)
    const mkArrow = (id, color) =>
      defs.append('marker')
        .attr('id', id).attr('viewBox', '0 -5 10 10')
        .attr('refX', 14).attr('refY', 0)
        .attr('markerWidth', 5).attr('markerHeight', 5).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', color);

    mkArrow('arr',     '#94a3b8');
    mkArrow('arr-out', '#6366f1');
    mkArrow('arr-in',  '#10b981');

    const sf = defs.append('filter').attr('id', 'sf')
      .attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    sf.append('feDropShadow').attr('dx', 0).attr('dy', 3).attr('stdDeviation', 5)
      .attr('flood-color', '#0f172a').attr('flood-opacity', 0.07);

    const hf = defs.append('filter').attr('id', 'hf')
      .attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    hf.append('feDropShadow').attr('dx', 0).attr('dy', 6).attr('stdDeviation', 12)
      .attr('flood-color', '#6366f1').attr('flood-opacity', 0.2);

    // ── Zoom / pan ─────────────────────────────────────────────────────────
    const root = svg.append('g');
    const zoom = d3.zoom().scaleExtent([0.1, 4])
      .on('zoom', e => root.attr('transform', e.transform));
    svg.call(zoom).on('dblclick.zoom', null);

    // ── Simulation data ────────────────────────────────────────────────────
    // Overview mode: use pre-computed grid positions (fixed)
    // Drill-down mode: random start near center, force takes over
    const isOverview = overviewLevel !== null;

    const sNodes = nodes.map(n => {
      const base = {
        ...n,
        x: isOverview ? (n.position?.x ?? 0) : W / 2 + (Math.random() - 0.5) * 120,
        y: isOverview ? (n.position?.y ?? 0) : H / 2 + (Math.random() - 0.5) * 120,
      };
      if (isOverview) { base.fx = base.x; base.fy = base.y; }
      return base;
    });

    const nodeById = new Map(sNodes.map(n => [n.id, n]));
    const sEdges   = edges
      .filter(e => nodeById.has(e.source) && nodeById.has(e.target))
      .map(e => ({ ...e }));

    // ── Draw edges ─────────────────────────────────────────────────────────
    const edgeG   = root.append('g').attr('class', 'edges');
    const edgeSel = edgeG.selectAll('g').data(sEdges).join('g');

    const eLine = edgeSel.append('line')
      .attr('stroke', '#cbd5e1').attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,4').attr('marker-end', 'url(#arr)').attr('opacity', 0.8);

    // Animated dash flow for edges marked animated:true
    edgeSel.filter(d => d.animated).each(function() {
      d3.select(this).select('line').append('animate')
        .attr('attributeName', 'stroke-dashoffset')
        .attr('from', '0').attr('to', '-9').attr('dur', '0.7s').attr('repeatCount', 'indefinite');
    });

    const eLabel = edgeSel.append('text')
      .text(d => d.label || '')
      .attr('text-anchor', 'middle').attr('font-size', '9px').attr('font-weight', '700')
      .attr('fill', '#64748b').attr('dy', -6).attr('font-family', 'system-ui, sans-serif');

    // ── Draw nodes ─────────────────────────────────────────────────────────
    const nodeG   = root.append('g').attr('class', 'nodes');
    const nodeSel = nodeG.selectAll('g').data(sNodes, d => d.id).join('g')
      .style('opacity', d => d.data.isDimmed ? 0.15 : 1)
      .style('cursor',  d => d.type !== 'serviceNode' ? 'pointer' : 'default')
      .on('mouseenter', function(_, hovered) {
        const hid = hovered.id;

        // ── Highlight / dim edges by direction ────────────────────────────
        edgeSel.each(function(e) {
          const src    = e.source?.id ?? e.source;
          const tgt    = e.target?.id ?? e.target;
          const isOut  = src === hid;
          const isIn   = tgt === hid;
          const isConn = isOut || isIn;

          d3.select(this).select('line')
            .transition().duration(180)
            .attr('stroke',           isConn ? (isOut ? '#6366f1' : '#10b981') : '#e2e8f0')
            .attr('stroke-width',     isConn ? 3 : 1)
            .attr('stroke-dasharray', isConn ? 'none' : '5,4')
            .attr('opacity',          isConn ? 1 : 0.12)
            .attr('marker-end',       isOut  ? 'url(#arr-out)' : isIn ? 'url(#arr-in)' : 'url(#arr)');

          d3.select(this).select('text')
            .transition().duration(180)
            .attr('fill',      isConn ? (isOut ? '#6366f1' : '#10b981') : '#e2e8f0')
            .attr('font-size', isConn ? '10px' : '9px')
            .attr('opacity',   isConn ? 1 : 0.15);
        });

        // ── Dim unconnected nodes, keep connected ones bright ─────────────
        nodeSel.each(function(n) {
          if (n.id === hid) return;
          const isNeighbour = sEdges.some(e => {
            const s = e.source?.id ?? e.source;
            const t = e.target?.id ?? e.target;
            return (s === hid && t === n.id) || (t === hid && s === n.id);
          });
          d3.select(this).transition().duration(180)
            .style('opacity', isNeighbour ? 1 : 0.18);
        });

        // ── Lift hovered node ─────────────────────────────────────────────
        d3.select(this).select('.bg')
          .attr('filter', 'url(#hf)').transition().duration(150).attr('stroke-width', 2.5);
      })
      .on('mouseleave', function() {
        // Reset edges
        edgeSel.each(function() {
          d3.select(this).select('line')
            .transition().duration(200)
            .attr('stroke', '#cbd5e1').attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '5,4').attr('opacity', 0.8)
            .attr('marker-end', 'url(#arr)');
          d3.select(this).select('text')
            .transition().duration(200)
            .attr('fill', '#64748b').attr('font-size', '9px').attr('opacity', 1);
        });

        // Reset all nodes
        nodeSel.each(function(n) {
          d3.select(this).transition().duration(200)
            .style('opacity', n.data.isDimmed ? 0.15 : 1);
        });

        // Reset hovered node
        d3.select(this).select('.bg')
          .attr('filter', 'url(#sf)').transition().duration(150).attr('stroke-width', 1.5);
      })
      .on('click', (e, d) => { e.stopPropagation(); setSelection(d.id); });

    nodeSel.each(function(d) {
      const el   = d3.select(this);
      const lv   = d.level ?? 2;
      const sz   = SZ[lv] ?? SZ[2];
      const hc   = HEALTH[d.data.health] ?? HEALTH.Healthy;
      const isC  = d.type !== 'serviceNode';
      const bg   = isC ? (LEVEL_BG[lv] ?? '#f8fafc') : '#ffffff';
      const dash = lv === 0 ? '8,5' : lv === 1 ? '5,3' : 'none';
      const fs   = lv <= 1 ? 13 : 11;
      const hw   = sz.w / 2;
      const hh   = sz.h / 2;

      // Truncate long labels
      const maxCh = Math.floor((sz.w - 32) / (fs * 0.58));
      const label = d.data.label.length > maxCh
        ? d.data.label.slice(0, maxCh - 1) + '…'
        : d.data.label;

      // Background rect
      el.append('rect').attr('class', 'bg')
        .attr('x', -hw).attr('y', -hh).attr('width', sz.w).attr('height', sz.h)
        .attr('rx', sz.r).attr('fill', bg)
        .attr('stroke', hc.stroke).attr('stroke-width', 1.5)
        .attr('stroke-dasharray', dash).attr('filter', 'url(#sf)');

      // Left health accent bar
      el.append('rect')
        .attr('x', -hw).attr('y', -hh + 10).attr('width', 3).attr('height', sz.h - 20)
        .attr('rx', 2).attr('fill', hc.stroke);

      // Label
      el.append('text').text(label)
        .attr('x', -hw + 14).attr('y', lv <= 1 ? -4 : 3)
        .attr('font-size', `${fs}px`).attr('font-weight', '800')
        .attr('fill', '#0f172a').attr('font-family', 'system-ui, sans-serif');

      // Subtitle: level · type
      el.append('text').text(`L${lv} · ${TYPE_LABEL[d.type] ?? 'node'}`)
        .attr('x', -hw + 14).attr('y', lv <= 1 ? 11 : 16)
        .attr('font-size', '9px').attr('font-weight', '600')
        .attr('fill', '#94a3b8').attr('font-family', 'system-ui, sans-serif')
        .attr('letter-spacing', '0.07em');

      // Health dot
      el.append('circle').attr('cx', hw - 14).attr('cy', 0).attr('r', 4).attr('fill', hc.dot);

      // Latency pill (leaf nodes only)
      if (!isC) {
        el.append('text').text(d.data.latency || '24ms')
          .attr('x', hw - 14).attr('y', 13).attr('text-anchor', 'middle')
          .attr('font-size', '8px').attr('font-weight', '700')
          .attr('fill', '#64748b').attr('font-family', 'system-ui, sans-serif');
      }

      // Incident ping (animated ring + dot)
      if (d.data.hasActiveIncident) {
        const pg = el.append('g').attr('transform', `translate(${hw - 5},${-hh + 5})`);
        pg.append('circle').attr('r', 7).attr('fill', '#ef4444').attr('opacity', 0.35)
          .append('animate').attr('attributeName', 'r')
          .attr('values', '5;11;5').attr('dur', '1.5s').attr('repeatCount', 'indefinite');
        pg.append('circle').attr('r', 5).attr('fill', '#ef4444');
        pg.append('text').text('!')
          .attr('text-anchor', 'middle').attr('dy', 4)
          .attr('font-size', '7px').attr('font-weight', '900')
          .attr('fill', '#fff').attr('font-family', 'system-ui, sans-serif');
      }

      // Drill-in arrow (cluster nodes only)
      if (isC) {
        el.append('text').text('⤵')
          .attr('x', hw - 22).attr('y', hh - 8)
          .attr('font-size', '11px').attr('fill', '#6366f1').attr('opacity', 0.55);
      }
    });

    // ── Force simulation ───────────────────────────────────────────────────
    const sim = d3.forceSimulation(sNodes)
      .force('link',    d3.forceLink(sEdges).id(d => d.id).distance(230).strength(0.3))
      .force('charge',  d3.forceManyBody().strength(-700))
      .force('center',  d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide().radius(d => {
        const sz = SZ[d.level ?? 2] ?? SZ[2];
        return Math.max(sz.w, sz.h) / 2 + 28;
      }).strength(0.8))
      .alphaDecay(0.04);

    simRef.current = sim;

    // Tick: update SVG positions
    const tick = () => {
      nodeSel.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
      eLine
        .attr('x1', d => d.source.x ?? 0).attr('y1', d => d.source.y ?? 0)
        .attr('x2', d => d.target.x ?? 0).attr('y2', d => d.target.y ?? 0);
      eLabel
        .attr('x', d => ((d.source.x ?? 0) + (d.target.x ?? 0)) / 2)
        .attr('y', d => ((d.source.y ?? 0) + (d.target.y ?? 0)) / 2);
    };

    sim.on('tick', tick);

    // Pre-run ticks for a cleaner initial layout (no "explosion" effect)
    for (let i = 0; i < 100; i++) sim.tick();
    tick();

    // Auto-fit viewport to all nodes
    const fitAll = () => {
      if (!sNodes.length) return;
      const xs  = sNodes.map(n => n.x ?? 0);
      const ys  = sNodes.map(n => n.y ?? 0);
      const pad = 100;
      const x0  = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad;
      const y0  = Math.min(...ys) - pad, y1 = Math.max(...ys) + pad;
      const sc  = Math.min((W * 0.9) / (x1 - x0), (H * 0.9) / (y1 - y0), 1.5);
      svg.transition().duration(600).call(
        zoom.transform,
        d3.zoomIdentity.translate((W - (x0 + x1) * sc) / 2, (H - (y0 + y1) * sc) / 2).scale(sc)
      );
    };

    sim.on('end', fitAll);
    if (isOverview) { sim.stop(); fitAll(); } // fixed positions — no simulation needed

    return () => sim.stop();
  }, [nodes, edges, currentParentId, overviewLevel, setSelection]);

  return (
    <div ref={containerRef} className="h-full w-full bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-inner relative">
      <svg ref={svgRef} className="w-full h-full" />

      {/* Perspective badge */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm border border-slate-100 rounded-xl shadow-sm pointer-events-none">
        <div className={`w-2 h-2 rounded-full ${overviewLevel !== null ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`} />
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {overviewLevel !== null
            ? `All L${overviewLevel} Nodes`
            : currentParentId ? 'Drill-down' : 'Root Topology'}
        </span>
      </div>

      {/* Zoom hint */}
      <div className="absolute bottom-4 right-4 text-[9px] font-bold text-slate-300 pointer-events-none uppercase tracking-widest">
        Scroll to zoom · Drag to pan
      </div>
    </div>
  );
};

export default ServiceMap;

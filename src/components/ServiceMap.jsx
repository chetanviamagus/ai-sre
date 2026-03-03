import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useDashboardStore } from '../store/useDashboardStore';

// ── Visual constants ──────────────────────────────────────────────────────────
const SZ = [
  { w: 200, h: 72, r: 14 }, // L0 – cluster
  { w: 184, h: 66, r: 12 }, // L1 – namespace
  { w: 168, h: 62, r: 10 }, // L2 – group
  { w: 154, h: 58, r: 9  }, // L3 – service
  { w: 140, h: 52, r: 8  }, // L4 – pod/instance
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

// ── Service logo badges ───────────────────────────────────────────────────────
const BADGE_MAP = [
  { match: /kafka(?!.*zk)|broker/i,    bg: '#FF6900', text: 'K',   hint: 'Apache Kafka'  },
  { match: /zookeeper|^zk[-_]?\d/i,   bg: '#C07000', text: 'ZK',  hint: 'ZooKeeper'     },
  { match: /flink/i,                   bg: '#E6526F', text: 'FL',  hint: 'Apache Flink'  },
  { match: /spark/i,                   bg: '#E25A1C', text: 'SP',  hint: 'Apache Spark'  },
  { match: /redshift/i,                bg: '#8B5CF6', text: 'RS',  hint: 'AWS Redshift'  },
  { match: /glue/i,                    bg: '#F59E0B', text: 'GL',  hint: 'AWS Glue'      },
  { match: /fraud/i,                   bg: '#7C3AED', text: 'FD',  hint: 'Fraud Detect'  },
  { match: /payment|processor/i,       bg: '#059669', text: 'PAY', hint: 'Payment'       },
  { match: /auth|token/i,              bg: '#6366F1', text: 'AU',  hint: 'Auth'          },
  { match: /gateway/i,                 bg: '#0EA5E9', text: 'GW',  hint: 'API Gateway'   },
  { match: /redis|session.*store/i,    bg: '#DC2626', text: 'RD',  hint: 'Redis'         },
  { match: /order/i,                   bg: '#F97316', text: 'ORD', hint: 'Order Service' },
  { match: /cart/i,                    bg: '#65A30D', text: 'CT',  hint: 'Cart Service'  },
  { match: /inventory/i,               bg: '#0D9488', text: 'INV', hint: 'Inventory'     },
  { match: /schema.*registry/i,        bg: '#78716C', text: 'SR',  hint: 'Schema Reg'    },
  { match: /email/i,                   bg: '#0891B2', text: 'EM',  hint: 'Email Service' },
  { match: /push|notification/i,       bg: '#7C3AED', text: 'PN',  hint: 'Push Notify'   },
  { match: /rate.*limit/i,             bg: '#DC2626', text: 'RL',  hint: 'Rate Limiter'  },
  { match: /profile/i,                 bg: '#0369A1', text: 'PR',  hint: 'Profile Svc'   },
  { match: /pod[-_]?\d/i,              bg: '#326CE5', text: '⬡',   hint: 'K8s Pod'       },
];

const getBadge = (label) => {
  for (const b of BADGE_MAP) {
    if (b.match.test(label)) return b;
  }
  return null;
};

// ── DAG (top-down layered) layout ─────────────────────────────────────────────
const computeDagLayout = (sNodes, rawEdges, W, H) => {
  const nodeIdSet = new Set(sNodes.map(n => n.id));
  const edges = rawEdges
    .map(e => ({ src: e.source?.id ?? e.source, tgt: e.target?.id ?? e.target }))
    .filter(e => nodeIdSet.has(e.src) && nodeIdSet.has(e.tgt));

  const inDeg  = new Map(sNodes.map(n => [n.id, 0]));
  const outAdj = new Map(sNodes.map(n => [n.id, []]));
  edges.forEach(({ src, tgt }) => {
    inDeg.set(tgt, (inDeg.get(tgt) || 0) + 1);
    outAdj.get(src)?.push(tgt);
  });

  const rank    = new Map();
  const sources = sNodes.filter(n => !inDeg.get(n.id));

  if (sources.length === 0) {
    sNodes.forEach(n => rank.set(n.id, 0));
  } else {
    sources.forEach(n => rank.set(n.id, 0));
    let frontier = sources.map(n => n.id);
    while (frontier.length) {
      const next = new Set();
      frontier.forEach(id => {
        outAdj.get(id)?.forEach(tid => {
          const nr = (rank.get(id) || 0) + 1;
          if (!rank.has(tid) || rank.get(tid) < nr) rank.set(tid, nr);
          next.add(tid);
        });
      });
      frontier = [...next];
    }
    sNodes.forEach(n => { if (!rank.has(n.id)) rank.set(n.id, 0); });
  }

  const rankGroups = new Map();
  sNodes.forEach(n => {
    const r = rank.get(n.id) || 0;
    if (!rankGroups.has(r)) rankGroups.set(r, []);
    rankGroups.get(r).push(n.id);
  });

  const maxRank  = Math.max(0, ...rank.values());
  const layerGap = maxRank === 0 ? 0 : Math.max((H - 160) / maxRank, 150);
  const positions = new Map();
  rankGroups.forEach((ids, r) => {
    ids.forEach((id, i) => {
      positions.set(id, {
        x: W / 2 + (i - (ids.length - 1) / 2) * 250,
        y: 80 + r * layerGap,
      });
    });
  });
  return positions;
};

// ── Cluster (swimlane) layout ─────────────────────────────────────────────────
const computeClusterLayout = (sNodes, W, H) => {
  const groups = new Map();
  sNodes.forEach(n => {
    const key = n.parentId ?? '__root__';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(n);
  });

  const positions = new Map();

  if (groups.size <= 1) {
    const all  = [...groups.values()][0] ?? [];
    const cols = Math.max(1, Math.ceil(Math.sqrt(all.length * 1.5)));
    all.forEach((n, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions.set(n.id, {
        x: W / 2 + (col - (cols - 1) / 2) * 240,
        y: H / 2 + (row - (Math.ceil(all.length / cols) - 1) / 2) * 160,
      });
    });
    return positions;
  }

  const groupList = [...groups.entries()];
  const gCols = Math.min(3, groupList.length);
  const gW    = (W - 80) / gCols;
  const gH    = (H - 80) / Math.ceil(groupList.length / gCols);

  groupList.forEach(([, groupNodes], gi) => {
    const gcol = gi % gCols;
    const grow = Math.floor(gi / gCols);
    const cx   = 40 + gcol * gW + gW / 2;
    const cy   = 40 + grow * gH + gH / 2;
    groupNodes.forEach((n, i) => {
      positions.set(n.id, {
        x: cx + (i - (groupNodes.length - 1) / 2) * 200,
        y: cy,
      });
    });
  });
  return positions;
};

// ── Table view (pure React) ───────────────────────────────────────────────────
const TableView = ({ nodes, setSelection }) => {
  const hCls = {
    Critical: 'bg-red-50 text-red-600 border-red-200',
    Warning:  'bg-yellow-50 text-yellow-600 border-yellow-200',
    Healthy:  'bg-emerald-50 text-emerald-600 border-emerald-200',
  };
  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse text-xs">
        <thead className="sticky top-0 z-10">
          <tr className="bg-slate-100 border-b-2 border-slate-200">
            {['SERVICE', 'TYPE', 'LVL', 'HEALTH', 'LATENCY', 'INCIDENT'].map(h => (
              <th key={h} className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {nodes.map((n, i) => {
            const badge = getBadge(n.data.label);
            const isC   = n.type !== 'serviceNode';
            return (
              <tr
                key={n.id}
                onClick={() => setSelection(n.id)}
                className={`border-b border-slate-100 cursor-pointer transition-colors hover:bg-indigo-50/60 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {badge && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded text-white shrink-0" style={{ background: badge.bg }}>
                        {badge.text}
                      </span>
                    )}
                    <span className="font-semibold text-slate-800">{n.data.label}</span>
                    {isC && <span className="text-[10px] text-indigo-400 font-bold">⤵</span>}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-slate-500">{TYPE_LABEL[n.type] ?? 'node'}</td>
                <td className="px-4 py-2.5">
                  <span className="bg-slate-100 text-slate-600 font-black px-2 py-0.5 rounded-full text-[10px]">L{n.level}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${hCls[n.data.health] ?? hCls.Healthy}`}>
                    {n.data.health}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-400 font-mono">{n.data.latency ?? (isC ? '—' : '24ms')}</td>
                <td className="px-4 py-2.5">
                  {n.data.hasActiveIncident && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-red-500">ACTIVE</span>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ── Main ServiceMap component ─────────────────────────────────────────────────
const ServiceMap = () => {
  const svgRef       = useRef(null);
  const containerRef = useRef(null);
  const simRef       = useRef(null);

  const {
    viewMode = 'force', getFilteredData, setSelection,
    currentParentId, overviewLevel, allNodes,
  } = useDashboardStore();

  const { nodes, edges } = getFilteredData();

  // ── D3 effect (runs for all non-table modes) ────────────────────────────────
  useEffect(() => {
    if (viewMode === 'table') {
      if (simRef.current) simRef.current.stop();
      return;
    }

    const container = containerRef.current;
    const svgEl     = svgRef.current;
    if (!container || !svgEl) return;

    const W = container.clientWidth  || 800;
    const H = container.clientHeight || 500;

    if (simRef.current) simRef.current.stop();

    const svg = d3.select(svgEl).attr('width', W).attr('height', H);
    svg.selectAll('*').remove();
    if (!nodes.length) return;

    // Defs: arrowheads + shadows
    const defs = svg.append('defs');
    const mkArrow = (id, color) =>
      defs.append('marker')
        .attr('id', id).attr('viewBox', '0 -5 10 10')
        .attr('refX', 14).attr('refY', 0)
        .attr('markerWidth', 5).attr('markerHeight', 5).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', color);
    mkArrow('arr',     '#94a3b8');
    mkArrow('arr-out', '#6366f1');
    mkArrow('arr-in',  '#10b981');

    defs.append('filter').attr('id', 'sf')
      .attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%')
      .append('feDropShadow')
      .attr('dx', 0).attr('dy', 3).attr('stdDeviation', 5)
      .attr('flood-color', '#0f172a').attr('flood-opacity', 0.07);

    defs.append('filter').attr('id', 'hf')
      .attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%')
      .append('feDropShadow')
      .attr('dx', 0).attr('dy', 6).attr('stdDeviation', 12)
      .attr('flood-color', '#6366f1').attr('flood-opacity', 0.2);

    // Zoom / pan
    const root = svg.append('g');
    const zoom = d3.zoom().scaleExtent([0.1, 4])
      .on('zoom', e => root.attr('transform', e.transform));
    svg.call(zoom).on('dblclick.zoom', null);

    // ── Compute positions based on mode ──────────────────────────────────────
    const isOverview = overviewLevel !== null;
    const tempNodes  = nodes.map(n => ({ ...n }));
    const nodeIdSet  = new Set(tempNodes.map(n => n.id));
    const tempEdges  = edges
      .filter(e => nodeIdSet.has(e.source) && nodeIdSet.has(e.target))
      .map(e => ({ ...e }));

    let posMap = null;
    if (isOverview) {
      posMap = new Map(nodes.map(n => [n.id, n.position ?? { x: 0, y: 0 }]));
    } else if (viewMode === 'tree') {
      posMap = computeDagLayout(tempNodes, tempEdges, W, H);
    } else if (viewMode === 'cluster') {
      posMap = computeClusterLayout(tempNodes, W, H);
    }
    // force: posMap stays null, simulation handles positions

    const sNodes = nodes.map(n => {
      const base = {
        ...n,
        x: posMap ? (posMap.get(n.id)?.x ?? W / 2) : W / 2 + (Math.random() - 0.5) * 120,
        y: posMap ? (posMap.get(n.id)?.y ?? H / 2) : H / 2 + (Math.random() - 0.5) * 120,
      };
      if (posMap) { base.fx = base.x; base.fy = base.y; }
      return base;
    });

    const nodeById = new Map(sNodes.map(n => [n.id, n]));
    const sEdges   = edges
      .filter(e => nodeById.has(e.source) && nodeById.has(e.target))
      .map(e => ({ ...e }));

    // ── Swimlane backgrounds (cluster mode, multiple parent groups) ───────────
    if (viewMode === 'cluster') {
      const laneGroups = new Map();
      sNodes.forEach(n => {
        const key = n.parentId ?? '__root__';
        if (!laneGroups.has(key)) laneGroups.set(key, []);
        laneGroups.get(key).push(n);
      });

      if (laneGroups.size > 1) {
        const laneG = root.append('g').attr('class', 'lanes');
        const LANE_COLORS = ['#eef2ff', '#eff6ff', '#f0fdf4', '#fefce8', '#fff7ed', '#fdf4ff'];
        let colorIdx = 0;
        laneGroups.forEach((groupNodes, parentId) => {
          const parentNode  = allNodes.find(n => n.id === parentId);
          const parentLabel = parentNode?.data?.label ?? parentId;
          const xs  = groupNodes.map(n => n.x ?? 0);
          const ys  = groupNodes.map(n => n.y ?? 0);
          const pad = 110;
          const x0  = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad;
          const y0  = Math.min(...ys) - 55,  y1 = Math.max(...ys) + 55;
          const bg  = LANE_COLORS[colorIdx++ % LANE_COLORS.length];

          laneG.append('rect')
            .attr('x', x0).attr('y', y0)
            .attr('width', x1 - x0).attr('height', y1 - y0)
            .attr('rx', 16).attr('fill', bg)
            .attr('stroke', '#e2e8f0').attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '6,4');

          laneG.append('text')
            .text(parentLabel)
            .attr('x', x0 + 14).attr('y', y0 + 18)
            .attr('font-size', '10px').attr('font-weight', '800')
            .attr('fill', '#94a3b8').attr('font-family', 'system-ui, sans-serif')
            .attr('letter-spacing', '0.05em');
        });
      }
    }

    // ── Draw edges ────────────────────────────────────────────────────────────
    const edgeG   = root.append('g').attr('class', 'edges');
    const edgeSel = edgeG.selectAll('g').data(sEdges).join('g');

    const eLine = edgeSel.append('line')
      .attr('stroke', '#cbd5e1').attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,4').attr('marker-end', 'url(#arr)').attr('opacity', 0.8);

    edgeSel.filter(d => d.animated).each(function() {
      d3.select(this).select('line').append('animate')
        .attr('attributeName', 'stroke-dashoffset')
        .attr('from', '0').attr('to', '-9').attr('dur', '0.7s').attr('repeatCount', 'indefinite');
    });

    const eLabel = edgeSel.append('text')
      .text(d => d.label || '')
      .attr('text-anchor', 'middle').attr('font-size', '9px').attr('font-weight', '700')
      .attr('fill', '#64748b').attr('dy', -6).attr('font-family', 'system-ui, sans-serif');

    // ── Draw nodes ────────────────────────────────────────────────────────────
    const nodeG   = root.append('g').attr('class', 'nodes');
    const nodeSel = nodeG.selectAll('g').data(sNodes, d => d.id).join('g')
      .style('opacity', d => d.data.isDimmed ? 0.15 : 1)
      .style('cursor',  d => d.type !== 'serviceNode' ? 'pointer' : 'default')
      .on('mouseenter', function(_, hovered) {
        const hid = hovered.id;
        edgeSel.each(function(e) {
          const src    = e.source?.id ?? e.source;
          const tgt    = e.target?.id ?? e.target;
          const isOut  = src === hid;
          const isIn   = tgt === hid;
          const isConn = isOut || isIn;
          d3.select(this).select('line').transition().duration(180)
            .attr('stroke',           isConn ? (isOut ? '#6366f1' : '#10b981') : '#e2e8f0')
            .attr('stroke-width',     isConn ? 3 : 1)
            .attr('stroke-dasharray', isConn ? 'none' : '5,4')
            .attr('opacity',          isConn ? 1 : 0.12)
            .attr('marker-end',       isOut ? 'url(#arr-out)' : isIn ? 'url(#arr-in)' : 'url(#arr)');
          d3.select(this).select('text').transition().duration(180)
            .attr('fill',      isConn ? (isOut ? '#6366f1' : '#10b981') : '#e2e8f0')
            .attr('font-size', isConn ? '10px' : '9px')
            .attr('opacity',   isConn ? 1 : 0.15);
        });
        nodeSel.each(function(n) {
          if (n.id === hid) return;
          const isNeighbour = sEdges.some(e => {
            const s = e.source?.id ?? e.source;
            const t = e.target?.id ?? e.target;
            return (s === hid && t === n.id) || (t === hid && s === n.id);
          });
          d3.select(this).transition().duration(180).style('opacity', isNeighbour ? 1 : 0.18);
        });
        d3.select(this).select('.bg').attr('filter', 'url(#hf)').transition().duration(150).attr('stroke-width', 2.5);
      })
      .on('mouseleave', function() {
        edgeSel.each(function() {
          d3.select(this).select('line').transition().duration(200)
            .attr('stroke', '#cbd5e1').attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '5,4').attr('opacity', 0.8)
            .attr('marker-end', 'url(#arr)');
          d3.select(this).select('text').transition().duration(200)
            .attr('fill', '#64748b').attr('font-size', '9px').attr('opacity', 1);
        });
        nodeSel.each(function(n) {
          d3.select(this).transition().duration(200).style('opacity', n.data.isDimmed ? 0.15 : 1);
        });
        d3.select(this).select('.bg').attr('filter', 'url(#sf)').transition().duration(150).attr('stroke-width', 1.5);
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

      const badge      = getBadge(d.data.label);
      const labelOffX  = badge ? -hw + 34 : -hw + 14;
      const maxCh      = Math.floor((sz.w - (badge ? 52 : 32)) / (fs * 0.58));
      const label      = d.data.label.length > maxCh
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

      // Service logo badge
      if (badge) {
        const bw = Math.max(badge.text.length * 6 + 8, 22);
        const badgeRect = el.append('rect')
          .attr('x', -hw + 8).attr('y', -10)
          .attr('width', bw).attr('height', 18).attr('rx', 4)
          .attr('fill', badge.bg);
        badgeRect.append('title').text(badge.hint);

        el.append('text').text(badge.text)
          .attr('x', -hw + 8 + bw / 2).attr('y', 3)
          .attr('text-anchor', 'middle')
          .attr('font-size', '7px').attr('font-weight', '900')
          .attr('fill', '#ffffff').attr('font-family', 'system-ui, sans-serif')
          .attr('pointer-events', 'none');
      }

      // Label
      el.append('text').text(label)
        .attr('x', labelOffX).attr('y', lv <= 1 ? -4 : 3)
        .attr('font-size', `${fs}px`).attr('font-weight', '800')
        .attr('fill', '#0f172a').attr('font-family', 'system-ui, sans-serif');

      // Subtitle
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

      // Drill-in arrow (cluster/group nodes only)
      if (isC) {
        el.append('text').text('⤵')
          .attr('x', hw - 22).attr('y', hh - 8)
          .attr('font-size', '11px').attr('fill', '#6366f1').attr('opacity', 0.55);
      }
    });

    // ── Force simulation ──────────────────────────────────────────────────────
    const sim = d3.forceSimulation(sNodes)
      .force('link',    d3.forceLink(sEdges).id(d => d.id).distance(230).strength(0.3))
      .force('charge',  d3.forceManyBody().strength(-700))
      .force('center',  d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide().radius(d => {
        const s = SZ[d.level ?? 2] ?? SZ[2];
        return Math.max(s.w, s.h) / 2 + 28;
      }).strength(0.8))
      .alphaDecay(0.04);

    simRef.current = sim;

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
    for (let i = 0; i < 100; i++) sim.tick();
    tick();

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
    if (posMap) { sim.stop(); fitAll(); }

    return () => sim.stop();
  }, [nodes, edges, viewMode, currentParentId, overviewLevel, allNodes, setSelection]);

  // ── Status badge (shared across view modes) ───────────────────────────────
  const statusBadge = (
    <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm border border-slate-100 rounded-xl shadow-sm pointer-events-none">
      <div className={`w-2 h-2 rounded-full ${overviewLevel !== null ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`} />
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
        {overviewLevel !== null
          ? `All L${overviewLevel} Nodes`
          : currentParentId ? 'Drill-down' : 'Root Topology'}
        {' — '}{nodes.length} nodes
      </span>
    </div>
  );

  // ── Table view (no SVG) ───────────────────────────────────────────────────
  if (viewMode === 'table') {
    return (
      <div className="h-full w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-inner relative">
        <TableView nodes={nodes} setSelection={setSelection} />
        {statusBadge}
      </div>
    );
  }

  // ── D3 graph view ─────────────────────────────────────────────────────────
  const layoutLabel = { force: null, tree: 'DAG Layout', cluster: 'Swimlane' };

  return (
    <div ref={containerRef} className="h-full w-full bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-inner relative">
      <svg ref={svgRef} className="w-full h-full" />
      {statusBadge}
      <div className="absolute bottom-4 right-4 text-[9px] font-bold text-slate-300 pointer-events-none uppercase tracking-widest">
        {layoutLabel[viewMode] ?? 'Scroll to zoom · Drag to pan'}
      </div>
    </div>
  );
};

export default ServiceMap;

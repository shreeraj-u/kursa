"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { Info } from "lucide-react";

import type { CareerGraphData, GraphEdge, GraphNode, NodeKind, SkillState } from "@/lib/dashboard/career-graph/types";
import { KIND_LABEL, SKILL_STATE_COLOR } from "@/lib/dashboard/career-graph/constants";

// --- Visual encoding -------------------------------------------------------
// Skill nodes are coloured by STATE (the diagnostic channel, see SKILL_STATE_COLOR);
// other entities by TYPE (a restrained per-type palette). The Journey spine uses
// distinct shapes (big disc / diamond / target ring) so the trajectory stays legible.

const TYPE_COLOR: Record<NodeKind, string> = {
  you: "var(--ink)",
  role: "var(--accent)",
  milestone: "var(--ink-3)",
  skill: "var(--accent)",
  job: "oklch(0.52 0.09 300)",
  project: "oklch(0.55 0.08 200)",
  achievement: "oklch(0.66 0.1 85)",
  education: "oklch(0.55 0.08 330)",
};

const MARGIN = 90;
const PATH_VERTICAL_JITTER = 52;
const SKILL_LANE_OFFSET = 185;
const SKILL_LANE_JITTER = 130;
const EVIDENCE_LANE_JITTER = 380;
const DETACHED_X_JITTER = 220;

function xForMonths(m: number, maxMonths: number, width: number, leftMargin = MARGIN, rightMargin = MARGIN): number {
  const usable = Math.max(180, width - leftMargin - rightMargin);
  return leftMargin + (m / maxMonths) * usable;
}

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededOffset(id: string, amplitude: number): number {
  return ((hashId(id) % 1000) / 999 - 0.5) * amplitude;
}

function seedY(n: GraphNode, height: number): number {
  const center = height / 2;
  if (n.kind === "you" || n.kind === "role" || n.kind === "milestone") return center + seededOffset(n.id, PATH_VERTICAL_JITTER);
  if (n.kind === "skill") {
    const upper = n.skillState === "gap" || n.skillState === "building";
    return center + (upper ? -SKILL_LANE_OFFSET : SKILL_LANE_OFFSET) + seededOffset(n.id, SKILL_LANE_JITTER);
  }
  return center + seededOffset(n.id, EVIDENCE_LANE_JITTER);
}

function radiusOf(n: GraphNode): number {
  switch (n.kind) {
    case "you":
      return 16;
    case "role":
      return 13;
    case "milestone":
      return 10;
    case "job":
      return 8;
    default:
      return n.kind === "skill" ? (n.skillState === "gap" ? 7 : 6) : 6;
  }
}

function colorOf(n: GraphNode): string {
  if (n.kind === "skill" && n.skillState) return SKILL_STATE_COLOR[n.skillState];
  return TYPE_COLOR[n.kind];
}

// --- Simulation datum types ------------------------------------------------

type SimNode = GraphNode & SimulationNodeDatum;
type SimLink = SimulationLinkDatum<SimNode> & { kind: GraphEdge["kind"]; gap?: boolean; id: string };

interface GraphCanvasProps {
  data: CareerGraphData;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Node kinds to hide; skill states to hide. Empty = show all. */
  hiddenKinds: Set<NodeKind>;
  hiddenSkillStates: Set<SkillState>;
  gapsOnly: boolean;
}

export default function GraphCanvas({
  data,
  selectedId,
  onSelect,
  hiddenKinds,
  hiddenSkillStates,
  gapsOnly,
}: GraphCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Live simulation node/link objects (mutated in place by d3).
  const simNodesRef = useRef<SimNode[]>([]);
  const simLinksRef = useRef<SimLink[]>([]);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);

  // View transform (pan/zoom).
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const panRef = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const dragRef = useRef<{ node: SimNode; moved: boolean } | null>(null);
  // Set on pointer-up of a drag that moved, so the synthetic click that follows
  // doesn't also select the node. (The click fires after dragRef is cleared.)
  const suppressClickRef = useRef(false);

  const maxMonths = useMemo(() => {
    const months = data.nodes.map((n) => n.monthsFromNow).filter((m): m is number => m != null);
    return Math.max(1, ...months);
  }, [data.nodes]);
  const leftMargin = data.hasJourney ? Math.min(390, Math.max(MARGIN, size.w * 0.34)) : MARGIN;

  // Measure container.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // (Re)build the simulation whenever the data or canvas size changes.
  useEffect(() => {
    if (size.w === 0 || size.h === 0) return;

    // Carry positions forward across rebuilds (e.g. resize) so the graph doesn't
    // jump and re-randomize; only brand-new nodes get a seeded start.
    const prev = new Map(simNodesRef.current.map((n) => [n.id, n]));
    const nodes: SimNode[] = data.nodes.map((n) => {
      const p = prev.get(n.id);
      return {
        ...n,
        x:
          p?.x ??
          (n.monthsFromNow != null
            ? xForMonths(n.monthsFromNow, maxMonths, size.w, leftMargin)
            : leftMargin + (size.w - leftMargin - MARGIN) / 2 + seededOffset(n.id, DETACHED_X_JITTER)),
        y: p?.y ?? seedY(n, size.h),
      };
    });
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const links: SimLink[] = data.edges
      .filter((e) => byId.has(e.source) && byId.has(e.target))
      .map((e) => ({ id: e.id, source: e.source, target: e.target, kind: e.kind, gap: e.gap }));

    simNodesRef.current = nodes;
    simLinksRef.current = links;

    const sim = forceSimulation<SimNode, SimLink>(nodes)
      .force("charge", forceManyBody<SimNode>().strength(-420))
      .force(
        "link",
        forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance((l) => (l.kind === "spine" ? 150 : l.kind === "requires" ? 128 : 86))
          .strength((l) => (l.kind === "spine" ? 0.92 : l.kind === "requires" ? 0.34 : 0.18)),
      )
      .force("collide", forceCollide<SimNode>().radius((n) => radiusOf(n) + (n.kind === "milestone" ? 34 : n.kind === "skill" ? 22 : 18)))
      // Temporal X-axis: nodes with a month value are pulled hard onto the trajectory.
      .force(
        "x",
        forceX<SimNode>((n) =>
          n.monthsFromNow != null ? xForMonths(n.monthsFromNow, maxMonths, size.w, leftMargin) : leftMargin + (size.w - leftMargin - MARGIN) / 2,
        ).strength(
          (n) => (n.monthsFromNow != null ? 0.86 : 0.02),
        ),
      )
      .force(
        "y",
        forceY<SimNode>((n) => seedY(n, size.h)).strength((n) => (n.kind === "you" || n.kind === "role" || n.kind === "milestone" ? 0.34 : 0.14)),
      );

    let raf = 0;
    sim.on("tick", () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setTick((t) => t + 1);
      });
    });

    simRef.current = sim;
    return () => {
      sim.stop();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [data, size.w, size.h, maxMonths, leftMargin]);

  // --- Neighborhood highlight (hover or selection focus) ---
  const focusId = hoverId ?? selectedId;
  const neighborhood = useMemo(() => {
    if (!focusId) return null;
    const set = new Set<string>([focusId]);
    for (const e of data.edges) {
      if (e.source === focusId) set.add(e.target);
      if (e.target === focusId) set.add(e.source);
    }
    return set;
  }, [focusId, data.edges]);

  function isHidden(n: GraphNode): boolean {
    if (hiddenKinds.has(n.kind)) return true;
    if (n.kind === "skill" && n.skillState && hiddenSkillStates.has(n.skillState)) return true;
    if (gapsOnly && n.kind === "skill") return n.skillState !== "gap";
    return false;
  }

  // --- Pointer interactions (pan, zoom, node drag) ---
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    setView((v) => {
      const k = Math.min(3, Math.max(0.3, v.k * factor));
      const ratio = k / v.k;
      return { k, x: mx - (mx - v.x) * ratio, y: my - (my - v.y) * ratio };
    });
  }

  function pointAt(e: React.PointerEvent) {
    const rect = wrapRef.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left - view.x) / view.k, y: (e.clientY - rect.top - view.y) / view.k };
  }

  function onPointerDownNode(e: React.PointerEvent, node: SimNode) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { node, moved: false };
    simRef.current?.alphaTarget(0.25).restart();
    node.fx = node.x;
    node.fy = node.y;
  }

  function onPointerDownBg(e: React.PointerEvent) {
    if (dragRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    panRef.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (dragRef.current) {
      const p = pointAt(e);
      dragRef.current.node.fx = p.x;
      dragRef.current.node.fy = p.y;
      dragRef.current.moved = true;
      return;
    }
    const pan = panRef.current;
    if (pan) {
      const dx = e.clientX - pan.x;
      const dy = e.clientY - pan.y;
      const { vx, vy } = pan;
      setView((v) => ({ ...v, x: vx + dx, y: vy + dy }));
    }
  }

  function onPointerUp() {
    if (dragRef.current) {
      if (dragRef.current.moved) suppressClickRef.current = true;
      dragRef.current.node.fx = null;
      dragRef.current.node.fy = null;
      simRef.current?.alphaTarget(0);
      dragRef.current = null;
    }
    panRef.current = null;
  }

  const nodes = simNodesRef.current;
  const links = simLinksRef.current;
  const posById = new Map(nodes.map((n) => [n.id, n]));

  // Project a graph coordinate into screen space (for overlays).
  const sx = (gx: number) => view.x + gx * view.k;
  const sy = (gy: number) => view.y + gy * view.k;

  // Tooltip anchored to the hovered node.
  const hoverNode = hoverId ? posById.get(hoverId) : null;

  function labelVisible(n: GraphNode): boolean {
    if (n.kind === "you" || n.kind === "role" || n.kind === "milestone") return true;
    if (selectedId === n.id || hoverId === n.id) return true;
    if (n.kind === "skill" && n.skillState === "gap") return true; // gaps always named
    return view.k >= 0.85; // otherwise only when zoomed in
  }

  const nowX = sx(xForMonths(0, maxMonths, size.w, leftMargin));
  const targetX = sx(xForMonths(maxMonths, maxMonths, size.w, leftMargin));

  return (
    <div
      ref={wrapRef}
      className="relative h-full w-full overflow-hidden"
      style={{ background: "var(--bg)", touchAction: "none", cursor: panRef.current ? "grabbing" : "grab" }}
      onWheel={onWheel}
      onPointerDown={onPointerDownBg}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => {
        onPointerUp();
        setHoverId(null);
      }}
    >
      <svg width={size.w} height={size.h} className="block">
        <defs>
          <radialGradient id="cg-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--warn)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--warn)" stopOpacity="0" />
          </radialGradient>
          <marker id="cg-arrow-path" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent)" opacity="0.72" />
          </marker>
          <marker id="cg-arrow-gap" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--warn)" opacity="0.78" />
          </marker>
        </defs>

        {/* Time rails — screen space, so they stay crisp under zoom. */}
        {data.hasJourney && size.w > 0 && (
          <g pointerEvents="none">
            <line x1={nowX} y1={28} x2={nowX} y2={size.h - 28} stroke="var(--line-2)" strokeWidth={1} strokeDasharray="2 5" />
            <line x1={targetX} y1={28} x2={targetX} y2={size.h - 28} stroke="var(--accent-line)" strokeWidth={1} strokeDasharray="2 5" />
            <text x={nowX + 6} y={24} className="mono" style={{ fontSize: 9, fill: "var(--mute)" }}>
              NOW
            </text>
            <text x={targetX - 6} y={24} textAnchor="end" className="mono" style={{ fontSize: 9, fill: "var(--accent)" }}>
              TARGET · {maxMonths}mo
            </text>
            <text x={(nowX + targetX) / 2} y={size.h - 12} textAnchor="middle" className="mono" style={{ fontSize: 9, fill: "var(--mute-3)" }}>
              time → your path runs left to right
            </text>
          </g>
        )}

        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          {/* Edges */}
          <g>
            {links.map((l) => {
              const s = typeof l.source === "object" ? (l.source as SimNode) : posById.get(l.source as string);
              const t = typeof l.target === "object" ? (l.target as SimNode) : posById.get(l.target as string);
              if (!s || !t || s.x == null || t.x == null) return null;
              if (isHidden(s) || isHidden(t)) return null;

              const dim = neighborhood ? !(neighborhood.has(s.id) && neighborhood.has(t.id)) : false;
              const isSpine = l.kind === "spine";
              const isGapEdge = l.kind === "requires" && l.gap;
              const stroke = isGapEdge ? "var(--warn)" : isSpine ? "var(--accent)" : "var(--line-2)";
              const flowing = isSpine || isGapEdge;

              return (
                <line
                  key={l.id}
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke={stroke}
                  strokeWidth={isSpine ? 4 : isGapEdge ? 1.6 : 1}
                  strokeLinecap="round"
                  strokeOpacity={dim ? 0.06 : isGapEdge ? 0.72 : isSpine ? 0.82 : 0.24}
                  strokeDasharray={isGapEdge ? "4 4" : flowing ? "6 6" : undefined}
                  markerEnd={isSpine ? "url(#cg-arrow-path)" : isGapEdge ? "url(#cg-arrow-gap)" : undefined}
                  className={flowing && !dim ? "cg-flow" : undefined}
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {nodes.map((n) => {
              if (n.x == null || n.y == null || isHidden(n)) return null;
              const r = radiusOf(n);
              const fill = colorOf(n);
              const dim = neighborhood ? !neighborhood.has(n.id) : false;
              const selected = selectedId === n.id;
              const isGap = n.kind === "skill" && n.skillState === "gap";
              const isBuilding = n.kind === "skill" && n.skillState === "building";
              const isDormant = n.kind === "skill" && n.skillState === "dormant";
              const opacity = dim ? 0.18 : isDormant ? 0.6 : 1;

              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x},${n.y})`}
                  style={{ cursor: "pointer", opacity, transition: "opacity 200ms" }}
                  onPointerDown={(e) => onPointerDownNode(e, n)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (suppressClickRef.current) {
                      suppressClickRef.current = false;
                      return;
                    }
                    onSelect(selected ? null : n.id);
                  }}
                  onPointerEnter={() => setHoverId(n.id)}
                  onPointerLeave={() => setHoverId((h) => (h === n.id ? null : h))}
                >
                  {isGap && <circle r={r + 12} fill="url(#cg-glow)" />}
	                  <NodeShape
                    n={n}
                    r={r}
                    fill={fill}
                    selected={selected}
                    pulse={isBuilding || (n.kind === "milestone" && n.milestoneStatus === "in_progress")}
	                    gap={isGap}
	                  />
                  {n.kind === "milestone" && n.milestoneOrder != null && (
                    <text
                      y={3}
                      textAnchor="middle"
                      className="mono"
                      style={{
                        fontSize: 8,
                        fill: n.milestoneStatus === "completed" ? "white" : "var(--accent)",
                        pointerEvents: "none",
                        fontWeight: 700,
                      }}
                    >
                      {n.milestoneOrder}
                    </text>
                  )}
                  {labelVisible(n) && (
                    <text
                      y={r + 12}
                      textAnchor="middle"
                      className="mono"
                      style={{
                        fontSize: n.kind === "you" || n.kind === "role" ? 11 : 9,
                        fill: dim ? "var(--mute-3)" : "var(--ink)",
                        pointerEvents: "none",
                        letterSpacing: "0.02em",
                        paintOrder: "stroke",
                        stroke: "var(--bg)",
                        strokeWidth: 3,
                      }}
                    >
                      {truncate(n.label, 22)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Hover tooltip — plain-English explanation of the node. */}
      {hoverNode && hoverNode.x != null && hoverNode.y != null && !isHidden(hoverNode) && (
        <div
          className="pointer-events-none absolute z-30 w-56 rounded-md border px-2.5 py-2 shadow-sm"
          style={(() => {
            const r = radiusOf(hoverNode) * view.k;
            const cx = sx(hoverNode.x);
            const cy = sy(hoverNode.y);
            const above = cy - r - 96; // try to sit above the node
            const top = above >= 8 ? above : cy + r + 12; // else below
            return {
              left: Math.min(Math.max(8, cx - 112), Math.max(8, size.w - 232)),
              top: Math.min(top, size.h - 96),
              borderColor: "var(--line-2)",
              background: "var(--surface)",
            };
          })()}
        >
          <div className="mono text-2xs uppercase tracking-mono" style={{ color: "var(--mute-2)" }}>
            {KIND_LABEL[hoverNode.kind]}
            {hoverNode.kind === "skill" && hoverNode.skillState ? ` · ${hoverNode.skillState}` : ""}
          </div>
          <div className="mt-0.5 text-xs font-medium" style={{ color: "var(--ink)" }}>
            {hoverNode.label}
          </div>
          {hoverNode.hint && (
            <div className="mt-1 text-2xs leading-relaxed" style={{ color: "var(--mute)" }}>
              {hoverNode.hint}
            </div>
          )}
          <div className="mono mt-1 text-2xs" style={{ color: "var(--mute-3)" }}>
            click to pin · drag to move
          </div>
        </div>
      )}

      <Legend />

      <button
        type="button"
        onClick={() => setView({ x: 0, y: 0, k: 1 })}
        className="mono absolute bottom-3 right-3 z-20 rounded-md border px-2.5 py-1.5 text-2xs uppercase tracking-mono"
        style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--surface) 92%, transparent)", color: "var(--mute)" }}
      >
        reset view
      </button>

      <style>{`
        @keyframes cg-flow-move { to { stroke-dashoffset: -24; } }
        .cg-flow { animation: cg-flow-move 1.2s linear infinite; }
        @keyframes cg-pulse { 0%,100% { opacity: 0.9 } 50% { opacity: 0.4 } }
      `}</style>
    </div>
  );
}

function NodeShape({
  n,
  r,
  fill,
  selected,
  pulse,
  gap,
}: {
  n: GraphNode;
  r: number;
  fill: string;
  selected: boolean;
  pulse: boolean;
  gap: boolean;
}) {
  const ring = selected ? "var(--ink)" : "var(--bg)";
  const strokeW = selected ? 2 : 1.5;

  if (n.kind === "you") {
    return (
      <>
        <circle r={r} fill={fill} stroke={ring} strokeWidth={strokeW} />
        <circle r={r - 5} fill="var(--bg)" opacity={0.25} />
      </>
    );
  }
  if (n.kind === "role") {
    return (
      <>
        <circle r={r} fill="none" stroke={fill} strokeWidth={2.5} />
        <circle r={r - 5} fill={fill} />
      </>
    );
  }
  if (n.kind === "milestone") {
    const filled = n.milestoneStatus === "completed";
    const d = r * 1.25;
    return (
      <rect
        x={-d / 2}
        y={-d / 2}
        width={d}
        height={d}
        transform="rotate(45)"
        rx={2}
        fill={filled ? "var(--accent)" : "var(--surface)"}
        stroke={filled ? "var(--accent)" : "var(--accent-line)"}
        strokeWidth={2}
        className={pulse ? "cg-flow" : undefined}
      />
    );
  }

  return (
    <circle
      r={r}
      fill={fill}
      stroke={ring}
      strokeWidth={strokeW}
      strokeDasharray={gap ? "3 2" : undefined}
      className={pulse ? "cg-flow" : undefined}
    />
  );
}

// Collapsible key explaining shapes, skill colours, and line types.
function Legend() {
  const [open, setOpen] = useState(true);

  return (
    <div
      className="absolute bottom-3 left-3 z-20 rounded-md border"
      style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--surface) 92%, transparent)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mono flex w-full items-center gap-1.5 px-2.5 py-1.5 text-2xs uppercase tracking-mono"
        style={{ color: "var(--mute)" }}
      >
        <Info size={11} style={{ color: "var(--mute-2)" }} />
        Key
        <span style={{ color: "var(--mute-3)" }}>{open ? "–" : "+"}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-2.5 border-t px-2.5 py-2" style={{ borderColor: "var(--line)", width: 196 }}>
          <LegendGroup title="your path">
            <LegendRow glyph={<GlyphDisc />} label="You — today" />
            <LegendRow glyph={<GlyphDiamond />} label="Milestone — a step" />
            <LegendRow glyph={<GlyphRing />} label="Target role" />
          </LegendGroup>

          <LegendGroup title="skills (the dots)">
            <LegendRow glyph={<Dot c={SKILL_STATE_COLOR.owned} />} label="Owned — you have it" />
            <LegendRow glyph={<Dot c={SKILL_STATE_COLOR.gap} ring />} label="Gap — needed, missing" />
            <LegendRow glyph={<Dot c={SKILL_STATE_COLOR.dormant} />} label="Dormant — gone rusty" />
            <LegendRow glyph={<Dot c={SKILL_STATE_COLOR.building} />} label="Building — learning now" />
          </LegendGroup>

          <LegendGroup title="lines">
            <LegendRow glyph={<LineGlyph c="var(--accent)" dashed />} label="Your path" />
            <LegendRow glyph={<LineGlyph c="var(--warn)" dashed />} label="Milestone needs skill" />
            <LegendRow glyph={<LineGlyph c="var(--line-2)" />} label="Belongs to you" />
          </LegendGroup>
        </div>
      )}
    </div>
  );
}

function LegendGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="mono text-2xs uppercase tracking-mono" style={{ color: "var(--mute-3)", fontSize: 8 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function LegendRow({ glyph, label }: { glyph: React.ReactNode; label: string }) {
  return (
    <div className="mono flex items-center gap-2" style={{ fontSize: 9, color: "var(--mute)" }}>
      <span className="flex h-3.5 w-3.5 items-center justify-center">{glyph}</span>
      {label}
    </div>
  );
}

function Dot({ c, ring }: { c: string; ring?: boolean }) {
  return (
    <svg width={12} height={12}>
      <circle cx={6} cy={6} r={4.5} fill={c} stroke={ring ? c : "none"} strokeDasharray={ring ? "2 1.5" : undefined} />
    </svg>
  );
}
function GlyphDisc() {
  return (
    <svg width={12} height={12}>
      <circle cx={6} cy={6} r={5} fill="var(--ink)" />
    </svg>
  );
}
function GlyphDiamond() {
  return (
    <svg width={12} height={12}>
      <rect x={2.5} y={2.5} width={7} height={7} transform="rotate(45 6 6)" fill="var(--surface)" stroke="var(--accent)" strokeWidth={1.5} />
    </svg>
  );
}
function GlyphRing() {
  return (
    <svg width={12} height={12}>
      <circle cx={6} cy={6} r={5} fill="none" stroke="var(--accent)" strokeWidth={1.5} />
      <circle cx={6} cy={6} r={2} fill="var(--accent)" />
    </svg>
  );
}
function LineGlyph({ c, dashed }: { c: string; dashed?: boolean }) {
  return (
    <svg width={14} height={12}>
      <line x1={1} y1={6} x2={13} y2={6} stroke={c} strokeWidth={1.6} strokeDasharray={dashed ? "3 2" : undefined} />
    </svg>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

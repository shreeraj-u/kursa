// Career Graph — the data model for the node-link rendering of the whole Profile.
// See CONTEXT.md ("Career Graph") and docs/adr/0003-career-graph-edge-truthfulness.md.
//
// buildGraph() produces this UI-agnostic shape (no positions). The force layer adds
// x/y at render time. Every edge here is backed by real Profile data — no inferred
// relationships (ADR-0003).

export type NodeKind =
  | "you"
  | "role"
  | "milestone"
  | "skill"
  | "project"
  | "job"
  | "achievement"
  | "education";

// The diagnostic channel. Drives node colour/treatment (skills only).
//   owned     — in the Skill inventory, used recently
//   dormant   — owned but not used in ~6 months (a glossary "Dormant skill")
//   gap       — required by a Milestone, NOT in the inventory
//   building  — targeted by an active Learning Goal, not yet owned
export type SkillState = "owned" | "dormant" | "gap" | "building";

export type EdgeKind =
  | "spine" // you → milestone → … → role (the Career Journey backbone)
  | "requires" // milestone → skill (the skill-gap diagnostic edge)
  | "owns" // you → owned skill (not tied to any milestone)
  | "builds" // you → building skill (a learning goal)
  | "built-at" // project → job (real workHistoryId FK)
  | "worked" // you → job
  | "earned" // you → achievement
  | "studied"; // you → education

export interface GraphPathStep {
  id: string;
  label: string;
  kind: "you" | "milestone" | "role";
  sublabel?: string;
  monthsFromNow: number;
  status?: "not_started" | "in_progress" | "completed";
  requiredSkills: string[];
  gapSkills: string[];
}

export interface GraphNode {
  id: string;
  kind: NodeKind;
  label: string;
  sublabel?: string;
  /** Plain-English, context-aware explanation of what this node is (tooltip + panel). */
  hint?: string;

  // Skill-only
  skillState?: SkillState;
  /** Names of milestones that require this skill (for the detail panel). */
  requiredByMilestones?: string[];

  // Milestone-only
  milestoneOrder?: number;
  milestoneStatus?: "not_started" | "in_progress" | "completed";
  /** Used by the force layout to pin the node on the temporal X-axis. */
  monthsFromNow?: number;

  /** Canonical surface this node deep-links into, e.g. "/dashboard/skills". */
  href?: string;
  /** Freeform details rendered in the detail panel. */
  detail?: Array<{ label: string; value: string }>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
  /** True when a `requires` edge points at a gap skill (renders as a warning). */
  gap?: boolean;
}

export interface CareerGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** False when the user has no Career Journey yet (no spine, no gaps). */
  hasJourney: boolean;
  /** Ordered reader for the journey spine: You → milestones → target role. */
  pathSteps: GraphPathStep[];
  stats: {
    skills: number;
    gaps: number;
    dormant: number;
    building: number;
    milestones: number;
  };
}

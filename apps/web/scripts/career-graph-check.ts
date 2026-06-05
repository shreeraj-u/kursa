/* Runtime sanity check for buildGraph.
 * Run from apps/web: node ../../node_modules/.pnpm/tsx@4.22.3/node_modules/tsx/dist/cli.mjs scripts/career-graph-check.ts */
import { buildGraph } from "../src/lib/dashboard/career-graph/build-graph";
import type { CareerJourney, UserProfile } from "@kursa/types";

const NOW = new Date("2026-06-05").getTime();
const monthsAgo = (n: number) => new Date(NOW - n * 30 * 24 * 3600 * 1000);

const profile = {
  id: "p1",
  userId: "u1",
  location: "Berlin",
  bio: "engineer",
  targetRole: "Senior Backend Engineer",
  yearsOfExperience: 4,
  aspirations: null,
  values: null,
  onboardingDone: true,
  dashboardGuideCompletedAt: null,
  createdAt: monthsAgo(24),
  updatedAt: monthsAgo(1),
  skills: [
    { id: "s1", profileId: "p1", name: "Python", category: "technical", proficiencyLevel: "advanced", confidenceRating: 4, lastUsedDate: monthsAgo(1), source: "resume", createdAt: monthsAgo(20), updatedAt: monthsAgo(1) },
    { id: "s2", profileId: "p1", name: "React", category: "technical", proficiencyLevel: "advanced", confidenceRating: 5, lastUsedDate: monthsAgo(10), source: "resume", createdAt: monthsAgo(20), updatedAt: monthsAgo(10) },
    { id: "s3", profileId: "p1", name: "TypeScript", category: "technical", proficiencyLevel: "intermediate", confidenceRating: 3, lastUsedDate: monthsAgo(0), source: "self", createdAt: monthsAgo(5), updatedAt: monthsAgo(0) },
  ],
  workHistories: [
    { id: "w1", profileId: "p1", companyName: "Acme", roleTitle: "Backend Dev", startDate: monthsAgo(36), endDate: null, isCurrent: true, outcomes: null, createdAt: monthsAgo(36), updatedAt: monthsAgo(1) },
  ],
  educations: [
    { id: "e1", profileId: "p1", type: "degree", credentialName: "BSc Computer Science", issuer: "TU Berlin", completionDate: monthsAgo(48), metadata: null, createdAt: monthsAgo(48), updatedAt: monthsAgo(48) },
  ],
  achievements: [
    { id: "a1", profileId: "p1", type: "hackathon", title: "Won HackZurich", issuer: null, description: null, url: null, dateAchieved: monthsAgo(12), metadata: null, createdAt: monthsAgo(12), updatedAt: monthsAgo(12) },
  ],
  projects: [
    { id: "pr1", profileId: "p1", workHistoryId: "w1", title: "Billing service", description: "internal", url: null, startDate: monthsAgo(18), endDate: monthsAgo(6), outcomes: null, createdAt: monthsAgo(18), updatedAt: monthsAgo(6) },
    { id: "pr2", profileId: "p1", workHistoryId: null, title: "Side project CLI", description: null, url: "https://x", startDate: null, endDate: null, outcomes: null, createdAt: monthsAgo(3), updatedAt: monthsAgo(3) },
  ],
  languages: [],
  workAuthorizations: [],
  constraints: [],
  learningGoals: [
    { id: "lg1", profileId: "p1", skillName: "Kubernetes", targetProficiency: "intermediate", deadline: null, status: "active", position: 0, createdAt: monthsAgo(2), updatedAt: monthsAgo(2) },
  ],
  socialLinks: [],
  jobApplications: [],
} as unknown as UserProfile;

const journey = {
  id: "j1",
  title: "Path to Senior Backend Engineer",
  description: "...",
  confidenceScore: 0.72,
  projectedTimelineMonths: 18,
  milestones: [
    { order: 1, title: "Own a backend service", description: "", status: "in_progress", estimatedMonthsFromNow: 3, salaryBand: { min: 70000, max: 90000, currency: "USD" }, requiredSkills: ["Python", "Go"] },
    { order: 2, title: "Lead a system design", description: "", status: "not_started", estimatedMonthsFromNow: 9, salaryBand: { min: 90000, max: 120000, currency: "USD" }, requiredSkills: ["System Design", "Kubernetes"] },
    { order: 3, title: "Mentor & scale", description: "", status: "not_started", estimatedMonthsFromNow: 15, salaryBand: { min: 120000, max: 150000, currency: "USD" }, requiredSkills: ["Go", "Leadership"] },
  ],
} as unknown as CareerJourney;

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean) {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}`); }
}

const g = buildGraph(profile, journey, NOW);
const byId = new Map(g.nodes.map((n) => [n.id, n]));
const skill = (name: string) => g.nodes.find((n) => n.kind === "skill" && n.label.toLowerCase() === name.toLowerCase());

console.log("buildGraph runtime check\n");
console.log(`nodes=${g.nodes.length} edges=${g.edges.length} stats=${JSON.stringify(g.stats)}\n`);

check("has journey spine", g.hasJourney === true);
check("You node exists at month 0", byId.get("you")?.monthsFromNow === 0);
check("role node exists", g.nodes.some((n) => n.kind === "role"));
check("3 milestones", g.nodes.filter((n) => n.kind === "milestone").length === 3);

check("Python = owned (recent, required → bridge)", skill("Python")?.skillState === "owned");
check("React = dormant (10mo old)", skill("React")?.skillState === "dormant");
check("Go = gap (required, not owned)", skill("Go")?.skillState === "gap");
check("System Design = gap", skill("System Design")?.skillState === "gap");
check("Kubernetes = building (learning goal)", skill("Kubernetes")?.skillState === "building");
check("Leadership = gap", skill("Leadership")?.skillState === "gap");

check("stats.gaps = 3 (Go, System Design, Leadership)", g.stats.gaps === 3);
check("stats.dormant = 1 (React)", g.stats.dormant === 1);
check("stats.building = 1 (Kubernetes)", g.stats.building === 1);

const goNode = skill("Go")!;
const reqGoEdge = g.edges.find((e) => e.kind === "requires" && e.target === goNode.id);
check("requires-edge to Go is flagged gap", reqGoEdge?.gap === true);
const reqPyEdge = g.edges.find((e) => e.kind === "requires" && e.target === skill("Python")!.id);
check("requires-edge to Python NOT flagged gap", reqPyEdge?.gap === false);

check("spine you→milestone1 exists", g.edges.some((e) => e.kind === "spine" && e.source === "you" && e.target.startsWith("milestone:1:")));
check("spine terminates at role", g.edges.some((e) => e.kind === "spine" && e.target === "role"));
check("path reader has You + 3 milestones + role", g.pathSteps.length === 5 && g.pathSteps[0].kind === "you" && g.pathSteps.at(-1)?.kind === "role");
check("first path milestone carries gap summary", g.pathSteps.some((s) => s.kind === "milestone" && s.label === "Own a backend service" && s.gapSkills.includes("Go")));

const proj1 = g.nodes.find((n) => n.kind === "project" && n.label === "Billing service")!;
check("project with workHistoryId links to its job", g.edges.some((e) => e.kind === "built-at" && e.source === proj1.id && e.target === "job:w1"));
const proj2 = g.nodes.find((n) => n.kind === "project" && n.label === "Side project CLI")!;
check("project without job links to You", g.edges.some((e) => e.kind === "built-at" && e.source === "you" && e.target === proj2.id));

check("achievement spokes off You", g.edges.some((e) => e.kind === "earned"));
check("education spokes off You", g.edges.some((e) => e.kind === "studied"));

check("gap skill has context-aware hint naming milestone", Boolean(goNode.hint && goNode.hint.includes("Own a backend service")));
check("every node has a hint", g.nodes.every((n) => Boolean(n.hint)));
check("no orphan edges (endpoints exist)", g.edges.every((e) => byId.has(e.source) && byId.has(e.target)));

// Empty-state: no journey → identity only, no spine/gaps.
const g2 = buildGraph(profile, null, NOW);
check("no-journey: hasJourney false", g2.hasJourney === false);
check("no-journey: no milestone nodes", !g2.nodes.some((n) => n.kind === "milestone"));
check("no-journey: no gaps", g2.stats.gaps === 0);
check("no-journey: owned skills still present", Boolean(g2.nodes.find((n) => n.kind === "skill" && n.label === "Python")));

check("TypeScript (recent, not required) = owned", skill("TypeScript")?.skillState === "owned");

// Null profile → empty.
const g3 = buildGraph(null, null, NOW);
check("null profile → empty graph", g3.nodes.length === 0 && g3.edges.length === 0);

// Dedup: a milestone listing the same skill twice (case-variant) → one node, one edge.
const dupJourney = {
  id: "jd", title: "t", description: "", confidenceScore: 0.5, projectedTimelineMonths: 6,
  milestones: [{ order: 1, title: "M", description: "", status: "not_started", estimatedMonthsFromNow: 3, salaryBand: { min: 0, max: 0, currency: "USD" }, requiredSkills: ["Go", "go", "GO"] }],
} as unknown as CareerJourney;
const gd = buildGraph(profile, dupJourney, NOW);
check("dedup: duplicate required skill → single skill node", gd.nodes.filter((n) => n.kind === "skill" && n.label.toLowerCase() === "go").length === 1);
check("dedup: duplicate required skill → single requires edge", gd.edges.filter((e) => e.kind === "requires" && e.target === "skill:go").length === 1);
check("dedup: duplicate milestone order still has stable unique id", gd.nodes.some((n) => n.id.startsWith("milestone:1:0:")));
check("dedup: 'required by' not double-counted", (gd.nodes.find((n) => n.id === "skill:go")?.requiredByMilestones?.length ?? 0) === 1);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);

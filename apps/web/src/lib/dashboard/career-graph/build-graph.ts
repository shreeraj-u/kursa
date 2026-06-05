// Pure assembly of the Career Graph from a Profile + Career Journey.
//
// Edge truthfulness (ADR-0003): every edge below comes from a relationship that
// actually exists in the data — a milestone's requiredSkills, a learning goal's
// skillName, a project's workHistoryId, the milestone order, or a profileId spoke.
// Nothing here infers "demonstrates"-style links.
//
// Skills are the connective tissue: a skill node bridges the inventory ("what you
// have"), the journey ("what a milestone needs"), and learning goals ("what you're
// building"). The skill-gap story therefore renders itself.

import type {
  CareerJourney,
  UserProfile,
  UserSkill,
} from "@kursa/types";

import type {
  CareerGraphData,
  GraphEdge,
  GraphNode,
  GraphPathStep,
  SkillState,
} from "./types";

const DORMANT_AFTER_MS = 1000 * 60 * 60 * 24 * 30 * 6; // ~6 months

const norm = (name: string) => name.trim().toLowerCase();

function isDormant(skill: UserSkill, now: number): boolean {
  if (!skill.lastUsedDate) return false;
  const last = new Date(skill.lastUsedDate).getTime();
  if (Number.isNaN(last)) return false;
  // Glossary: not used in ~6 months, especially when confidence is high (>=4).
  return now - last > DORMANT_AFTER_MS;
}

function pushDetail(
  list: Array<{ label: string; value: string }>,
  label: string,
  value: string | number | null | undefined,
) {
  if (value === null || value === undefined || value === "") return;
  list.push({ label, value: String(value) });
}

export function buildGraph(
  profile: UserProfile | null,
  journey: CareerJourney | null,
  now: number = Date.now(),
): CareerGraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const pathSteps: GraphPathStep[] = [];

  if (!profile) {
    return {
      nodes,
      edges,
      hasJourney: false,
      pathSteps,
      stats: { skills: 0, gaps: 0, dormant: 0, building: 0, milestones: 0 },
    };
  }

  const hasJourney = Boolean(journey && journey.milestones.length > 0);

  // --- You: the Profile root, anchor of the trajectory. ---
  const youId = "you";
  nodes.push({
    id: youId,
    kind: "you",
    label: "You",
    sublabel: profile.targetRole ?? undefined,
    hint: "This is you, today. Your path runs to the right toward your target role.",
    monthsFromNow: 0,
    detail: (() => {
      const d: Array<{ label: string; value: string }> = [];
      pushDetail(d, "location", profile.location);
      pushDetail(d, "experience", profile.yearsOfExperience != null ? `${profile.yearsOfExperience} yrs` : null);
      pushDetail(d, "target role", profile.targetRole);
      return d;
    })(),
  });

  pathSteps.push({
    id: youId,
    kind: "you",
    label: "You",
    sublabel: profile.targetRole ?? undefined,
    monthsFromNow: 0,
    requiredSkills: [],
    gapSkills: [],
  });

  // --- Owned skills, indexed by normalised name. ---
  const ownedByName = new Map<string, UserSkill>();
  for (const s of profile.skills ?? []) ownedByName.set(norm(s.name), s);

  // --- Required skills, with the milestones that require each. ---
  // A milestone may list the same skill twice (or in different casing); dedupe
  // per milestone so a skill isn't double-counted or double-edged.
  const requiredBy = new Map<string, string[]>(); // norm name -> milestone titles
  if (journey) {
    for (const m of journey.milestones) {
      const seen = new Set<string>();
      for (const raw of m.requiredSkills ?? []) {
        const key = norm(raw);
        if (seen.has(key)) continue;
        seen.add(key);
        if (!requiredBy.has(key)) requiredBy.set(key, []);
        requiredBy.get(key)!.push(m.title);
      }
    }
  }

  // --- Learning goals (the "being built" set), indexed by normalised skill name. ---
  const learningByName = new Map<string, string>(); // norm -> display name
  for (const g of profile.learningGoals ?? []) {
    if (g.status === "abandoned" || g.status === "completed") continue;
    learningByName.set(norm(g.skillName), g.skillName);
  }

  // Resolve the state of a skill node by name (precedence resolved here).
  function skillStateFor(key: string, owned: UserSkill | undefined): SkillState {
    if (owned) return isDormant(owned, now) ? "dormant" : "owned";
    if (learningByName.has(key)) return "building"; // learning something not yet owned
    return "gap"; // required by a milestone but not owned
  }

  // Union of every skill name that should appear as a node.
  const skillNames = new Set<string>([
    ...ownedByName.keys(),
    ...requiredBy.keys(),
    ...learningByName.keys(),
  ]);

  const skillNodeId = (key: string) => `skill:${key}`;
  let gaps = 0;
  let dormant = 0;
  let building = 0;

  for (const key of skillNames) {
    const owned = ownedByName.get(key);
    const display = owned?.name ?? learningByName.get(key) ?? key;
    const state = skillStateFor(key, owned);
    if (state === "gap") gaps++;
    if (state === "dormant") dormant++;
    if (state === "building") building++;

    const detail: Array<{ label: string; value: string }> = [];
    pushDetail(detail, "state", state);
    if (owned) {
      pushDetail(detail, "category", owned.category);
      pushDetail(detail, "proficiency", owned.proficiencyLevel);
      pushDetail(detail, "confidence", owned.confidenceRating != null ? `${owned.confidenceRating}/5` : null);
    }
    const reqList = requiredBy.get(key);
    if (reqList?.length) pushDetail(detail, "required by", reqList.join(", "));

    const firstReq = reqList?.[0];
    const hint =
      state === "gap"
        ? `A skill ${firstReq ? `"${firstReq}"` : "a milestone"} needs, but it isn't in your inventory yet — a gap to close.`
        : state === "building"
          ? `You're currently learning this skill (a learning goal)${firstReq ? `; it's needed for "${firstReq}".` : "."}`
          : state === "dormant"
            ? "A skill you have but haven't used in ~6 months — worth refreshing."
            : reqList?.length
              ? `A skill you have — and your path needs it for "${firstReq}". Nice.`
              : "A skill you already have.";

    nodes.push({
      id: skillNodeId(key),
      kind: "skill",
      label: display,
      skillState: state,
      requiredByMilestones: reqList,
      hint,
      href: "/dashboard/skills",
      detail,
    });
  }

  // --- Milestone spine + role (only when a journey exists). ---
  if (hasJourney && journey) {
    const ordered = [...journey.milestones].sort((a, b) => a.order - b.order);
    let prevId = youId;

    for (const [index, m] of ordered.entries()) {
      // `order` is user-facing; combine it with index/title so duplicate orders do not collapse nodes.
      const id = `milestone:${m.order}:${index}:${norm(m.title).replace(/[^a-z0-9]+/g, "-")}`;
      const detail: Array<{ label: string; value: string }> = [];
      pushDetail(detail, "status", m.status.replace("_", " "));
      pushDetail(detail, "eta", `${m.estimatedMonthsFromNow} mo`);
      if (m.salaryBand && m.salaryBand.max > 0) {
        const lo = Math.round((m.salaryBand.min ?? 0) / 1000);
        const hi = Math.round(m.salaryBand.max / 1000);
        pushDetail(detail, "salary", `$${lo}k–${hi}k`);
      }
      pushDetail(detail, "requires", (m.requiredSkills ?? []).join(", "));

      const gapSkills = [...new Set((m.requiredSkills ?? []).map((raw) => raw.trim()).filter(Boolean))].filter((raw) => !ownedByName.has(norm(raw)));

      nodes.push({
        id,
        kind: "milestone",
        label: m.title,
        sublabel: `${m.estimatedMonthsFromNow} mo`,
        milestoneOrder: m.order,
        milestoneStatus: m.status,
        monthsFromNow: m.estimatedMonthsFromNow,
        hint: `Step ${m.order} on your path, about ${m.estimatedMonthsFromNow} months out. Amber spokes are missing skills this step needs; solid/darker spokes are skills you already have or are building.`,
        href: "/dashboard/career-journey",
        detail,
      });

      pathSteps.push({
        id,
        kind: "milestone",
        label: m.title,
        sublabel: `${m.estimatedMonthsFromNow} mo · ${m.status.replace("_", " ")}`,
        monthsFromNow: m.estimatedMonthsFromNow,
        status: m.status,
        requiredSkills: [...new Set((m.requiredSkills ?? []).map((raw) => raw.trim()).filter(Boolean))],
        gapSkills,
      });

      edges.push({ id: `spine:${prevId}->${id}`, source: prevId, target: id, kind: "spine" });
      prevId = id;

      // requires edges: milestone -> each required skill (deduped per milestone)
      const seenReq = new Set<string>();
      for (const raw of m.requiredSkills ?? []) {
        const key = norm(raw);
        if (seenReq.has(key)) continue;
        seenReq.add(key);
        const target = skillNodeId(key);
        const isGap = !ownedByName.has(key);
        edges.push({
          id: `requires:${id}->${target}`,
          source: id,
          target,
          kind: "requires",
          gap: isGap,
        });
      }
    }

    // Target role node terminates the spine.
    const roleLabel = profile.targetRole ?? journey.title;
    if (roleLabel) {
      const roleId = "role";
      const lastMonths = ordered[ordered.length - 1]?.estimatedMonthsFromNow ?? journey.projectedTimelineMonths;
      const roleMonths = (lastMonths ?? 0) + 2;
      nodes.push({
        id: roleId,
        kind: "role",
        label: roleLabel,
        sublabel: "target role",
        hint: "Where this path leads — the role your Career Journey is aimed at.",
        monthsFromNow: roleMonths,
        href: "/dashboard/career-journey",
        detail: [
          { label: "confidence", value: `${Math.round(journey.confidenceScore * 100)}%` },
          { label: "timeline", value: `${journey.projectedTimelineMonths} mo` },
        ],
      });
      pathSteps.push({
        id: roleId,
        kind: "role",
        label: roleLabel,
        sublabel: `${Math.round(journey.confidenceScore * 100)}% fit · ${journey.projectedTimelineMonths} mo plan`,
        monthsFromNow: roleMonths,
        requiredSkills: [],
        gapSkills: [],
      });
      edges.push({ id: `spine:${prevId}->role`, source: prevId, target: roleId, kind: "spine" });
    }
  }

  // --- Skill spokes for skills not tied to a milestone (owns / builds). ---
  for (const key of skillNames) {
    const id = skillNodeId(key);
    const requiredByMilestone = requiredBy.has(key);
    if (requiredByMilestone) continue; // already linked via a `requires` edge
    if (ownedByName.has(key)) {
      edges.push({ id: `owns:${id}`, source: youId, target: id, kind: "owns" });
    } else if (learningByName.has(key)) {
      edges.push({ id: `builds:${id}`, source: youId, target: id, kind: "builds" });
    }
  }

  // --- Work history (jobs) — spokes off You. ---
  const jobNodeId = (id: string) => `job:${id}`;
  for (const job of profile.workHistories ?? []) {
    const id = jobNodeId(job.id);
    const detail: Array<{ label: string; value: string }> = [];
    pushDetail(detail, "company", job.companyName);
    pushDetail(detail, "role", job.roleTitle);
    nodes.push({
      id,
      kind: "job",
      label: job.roleTitle,
      sublabel: job.companyName,
      hint: `A role in your work history${job.companyName ? ` at ${job.companyName}` : ""}. Projects you built there branch off it.`,
      href: "/dashboard/resume",
      detail,
    });
    edges.push({ id: `worked:${id}`, source: youId, target: id, kind: "worked" });
  }

  // --- Projects — attach to their job (real FK) or fall back to You. ---
  for (const proj of profile.projects ?? []) {
    const id = `project:${proj.id}`;
    nodes.push({
      id,
      kind: "project",
      label: proj.title,
      hint: "Something you built. Connected to the job where you made it, or to you.",
      href: "/dashboard/resume",
      detail: (() => {
        const d: Array<{ label: string; value: string }> = [];
        pushDetail(d, "title", proj.title);
        pushDetail(d, "link", proj.url);
        return d;
      })(),
    });
    const jobId = proj.workHistoryId ? jobNodeId(proj.workHistoryId) : null;
    const hasJob = jobId ? nodes.some((n) => n.id === jobId) : false;
    if (jobId && hasJob) {
      edges.push({ id: `built-at:${id}`, source: id, target: jobId, kind: "built-at" });
    } else {
      edges.push({ id: `built-at:${id}->you`, source: youId, target: id, kind: "built-at" });
    }
  }

  // --- Achievements — spokes off You (no FK by design, ADR-0003). ---
  for (const a of profile.achievements ?? []) {
    const id = `achievement:${a.id}`;
    nodes.push({
      id,
      kind: "achievement",
      label: a.title,
      sublabel: a.type,
      hint: "An achievement on your record — an award, hackathon, publication, and the like.",
      href: "/dashboard/resume",
      detail: (() => {
        const d: Array<{ label: string; value: string }> = [];
        pushDetail(d, "type", a.type);
        pushDetail(d, "issuer", a.issuer);
        return d;
      })(),
    });
    edges.push({ id: `earned:${id}`, source: youId, target: id, kind: "earned" });
  }

  // --- Education — spokes off You. ---
  for (const e of profile.educations ?? []) {
    const id = `education:${e.id}`;
    nodes.push({
      id,
      kind: "education",
      label: e.credentialName,
      sublabel: e.issuer,
      hint: "A degree, certification, or course from your education history.",
      href: "/dashboard/resume",
      detail: (() => {
        const d: Array<{ label: string; value: string }> = [];
        pushDetail(d, "type", e.type);
        pushDetail(d, "issuer", e.issuer);
        return d;
      })(),
    });
    edges.push({ id: `studied:${id}`, source: youId, target: id, kind: "studied" });
  }

  return {
    nodes,
    edges,
    hasJourney,
    pathSteps,
    stats: {
      skills: skillNames.size,
      gaps,
      dormant,
      building,
      milestones: hasJourney && journey ? journey.milestones.length : 0,
    },
  };
}

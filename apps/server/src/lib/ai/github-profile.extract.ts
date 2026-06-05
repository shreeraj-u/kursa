import { z } from "zod";

import type { GitHubNormalizedSnapshot, GitHubRepo } from "@kursa/types";

import { Models } from "./prompts.js";
import { openai } from "../openai.js";

const skillSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["technical", "soft", "tool"]),
  confidence: z.number().min(1).max(5).optional(),
  evidence: z.string().min(1),
});

const projectSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  evidence: z.string().min(1),
});

const memorySchema = z.object({
  category: z.enum(["skill_evidence", "pattern"]),
  fact: z.string().min(10),
});

const extractSchema = z.object({
  skills: z.array(skillSchema).default([]),
  projects: z.array(projectSchema).default([]),
  memories: z.array(memorySchema).default([]),
});

export type GitHubExtractResult = z.infer<typeof extractSchema>;

const GITHUB_EXTRACT_PROMPT = `You analyze a developer's GitHub profile snapshot and extract skills, project highlights, and memory facts for a career intelligence system.
Return JSON: { "skills": [{ "name", "category": "technical"|"soft"|"tool", "confidence": 1-5, "evidence" }], "projects": [{ "title", "description", "url", "evidence" }], "memories": [{ "category": "skill_evidence"|"pattern", "fact" }] }
Only include high-confidence items grounded in the data. Max 15 skills, 10 projects, 5 memories.`;

function ruleBasedExtract(snapshot: GitHubNormalizedSnapshot): GitHubExtractResult {
  const skills: GitHubExtractResult["skills"] = [];
  const seen = new Set<string>();

  const addSkill = (name: string, category: "technical" | "tool", evidence: string, confidence = 3) => {
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    skills.push({ name, category, confidence, evidence });
  };

  for (const { language, weight } of snapshot.workPatterns.languageMix) {
    addSkill(language, "technical", `Primary language in GitHub repos (weight ${weight.toFixed(1)})`, Math.min(5, Math.round(weight)));
  }
  for (const topic of snapshot.workPatterns.topTopics.slice(0, 8)) {
    addSkill(topic, "tool", `Recurring topic across active repos`);
  }
  for (const fw of snapshot.workPatterns.frameworkSignals.slice(0, 6)) {
    addSkill(fw, "technical", `Detected in README or repo metadata`);
  }

  const projects: GitHubExtractResult["projects"] = snapshot.workPatterns.activeRepos.slice(0, 8).map((r) => ({
    title: r.name,
    description: snapshot.repos.find((repo) => repo.name === r.name)?.description ?? null,
    url: r.url,
    evidence: `Active repo — last push ${r.pushedAt}`,
  }));

  const memories: GitHubExtractResult["memories"] = [];
  if (snapshot.workPatterns.activeRepos.length > 0) {
    memories.push({
      category: "pattern",
      fact: `Actively building on ${snapshot.workPatterns.activeRepos.length} GitHub repo${snapshot.workPatterns.activeRepos.length === 1 ? "" : "s"} (${snapshot.workPatterns.pushVelocity} velocity).`,
    });
  }
  if (snapshot.workPatterns.languageMix[0]) {
    memories.push({
      category: "skill_evidence",
      fact: `Primary GitHub stack centers on ${snapshot.workPatterns.languageMix[0].language}.`,
    });
  }

  return { skills, projects, memories };
}

export async function extractGitHubProfileIntelligence(
  snapshot: GitHubNormalizedSnapshot,
): Promise<GitHubExtractResult> {
  const fallback = ruleBasedExtract(snapshot);

  try {
    const payload = {
      profile: snapshot.profile,
      profileReadme: snapshot.profileReadme?.slice(0, 4000),
      workPatterns: snapshot.workPatterns,
      repos: snapshot.repos.slice(0, 12).map((r: GitHubRepo) => ({
        name: r.name,
        description: r.description,
        language: r.language,
        topics: r.topics,
        pushed_at: r.pushed_at,
        readmeExcerpt: (r as { readmeExcerpt?: string }).readmeExcerpt?.slice(0, 500),
      })),
    };

    const response = await openai.chat.completions.create({
      model: Models.fast,
      messages: [
        { role: "system", content: GITHUB_EXTRACT_PROMPT },
        { role: "user", content: JSON.stringify(payload) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 2000,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return fallback;

    const parsed = extractSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return fallback;

    return {
      skills: parsed.data.skills.length > 0 ? parsed.data.skills : fallback.skills,
      projects: parsed.data.projects.length > 0 ? parsed.data.projects : fallback.projects,
      memories: [...parsed.data.memories, ...fallback.memories].slice(0, 8),
    };
  } catch {
    return fallback;
  }
}

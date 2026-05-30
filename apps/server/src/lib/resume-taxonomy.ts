/** Deterministic skill keywords for hybrid resume fallback when LLM fails. */

const TECHNICAL = [
  "typescript",
  "javascript",
  "python",
  "java",
  "go",
  "golang",
  "rust",
  "c++",
  "react",
  "next.js",
  "nextjs",
  "node.js",
  "nodejs",
  "postgresql",
  "postgres",
  "mysql",
  "mongodb",
  "redis",
  "aws",
  "gcp",
  "azure",
  "kubernetes",
  "docker",
  "graphql",
  "sql",
  "html",
  "css",
  "tailwind",
  "vue",
  "angular",
  "django",
  "flask",
  "fastapi",
  "spring",
  "kafka",
  "terraform",
  "linux",
  "git",
  "machine learning",
  "deep learning",
  "tensorflow",
  "pytorch",
];

const TOOLS = [
  "jira",
  "figma",
  "slack",
  "notion",
  "github",
  "gitlab",
  "datadog",
  "sentry",
  "vercel",
  "railway",
  "linear",
];

const SOFT = [
  "leadership",
  "communication",
  "mentoring",
  "collaboration",
  "problem solving",
  "stakeholder management",
  "project management",
  "agile",
  "scrum",
];

function countOccurrences(text: string, term: string): number {
  const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
  return (text.match(re) ?? []).length;
}

export type TaxonomySkill = {
  name: string;
  category: "technical" | "soft" | "tool";
  confidenceRating: number;
};

export function extractSkillsFromTaxonomy(rawText: string): TaxonomySkill[] {
  const lower = rawText.toLowerCase();
  const found: TaxonomySkill[] = [];
  const seen = new Set<string>();

  const add = (name: string, category: TaxonomySkill["category"], count: number) => {
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const confidenceRating = count >= 3 ? 5 : count >= 2 ? 4 : 3;
    found.push({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      category,
      confidenceRating,
    });
  };

  for (const term of TECHNICAL) {
    const c = countOccurrences(lower, term);
    if (c > 0) add(term, "technical", c);
  }
  for (const term of TOOLS) {
    const c = countOccurrences(lower, term);
    if (c > 0) add(term, "tool", c);
  }
  for (const term of SOFT) {
    const c = countOccurrences(lower, term);
    if (c > 0) add(term, "soft", c);
  }

  return found.slice(0, 30);
}

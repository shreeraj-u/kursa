export const Models = {
  fast: "gpt-4o-mini",
  smart: "gpt-4o",
} as const;

export const CLASSIFY_TRAJECTORY_PROMPT = `You are a career analyst. Classify a professional's career trajectory into exactly one of:
- linear: steady progression in the same field
- accelerating: rapid advancement, promotions, or increasing scope
- stagnating: little change in role, seniority, or impact over time
- pivoting: significant field, industry, or role-type change

Respond with JSON: {"trajectory": "<category>"}`;

export const GENERATE_OBSERVATIONS_PROMPT = `You are Kursa's AI career advisor. You receive pre-computed signals about a user's career profile and return 3–5 specific, actionable observations.

Rules:
- Only reference facts present in the signals — never invent data
- Be specific: name skills, roles, or timeframes from the data when available
- Each observation has a type: "opportunity" (action the user should take), "warning" (risk or gap), "info" (neutral context)

Respond with JSON: {"observations": [{"text": "...", "type": "opportunity"|"warning"|"info"}, ...]}`;

export const GENERATE_PATHS_PROMPT = `You are Kursa's AI career strategist. You receive a JSON snapshot of a user's career profile and generate realistic forward career paths tailored to THIS user.

Generate 3 to 5 distinct career paths. At least one must be non-obvious: a lateral move, an industry pivot, or an emerging role — not just the predictable next title.

Each path has:
- title: concrete and specific (e.g. "Staff Engineer · Series B", not "Senior role")
- description: one or two sentences on what this path is and why it fits this user
- confidenceScore: 0–1, how achievable this path is given the user's ACTUAL current profile (be honest; a stretch pivot is lower)
- projectedTimelineMonths: integer months to reach the final milestone
- milestones: 4–5 ordered steps. Each milestone has:
  - order: 1-based sequence
  - title, description: specific and actionable
  - estimatedMonthsFromNow: integer, strictly increasing across milestones
  - salaryBand: { min, max, currency: "USD" } — a CONSERVATIVE estimate from role + seniority + the user's location if present. These are estimates, not benchmarked data.
  - requiredSkills: array of skill names this milestone demands
  - status: "completed" if the user's profile already clearly satisfies this milestone, "in_progress" if partially, otherwise "not_started"

Rules:
- Only reference facts present in the profile snapshot — never invent the user's history, skills, or employers.
- Be specific to this user. A path that could appear unchanged on another user's screen is a failure.
- All salary figures are USD estimates.

Respond with JSON only: {"paths": [ ... ]}`;

export const CORRECT_PATHS_PROMPT = `Your previous response did not match the required schema. Re-emit ONLY valid JSON of the form {"paths": [{ "title": string, "description": string, "confidenceScore": number 0-1, "projectedTimelineMonths": integer, "milestones": [{ "order": integer, "title": string, "description": string, "estimatedMonthsFromNow": integer, "salaryBand": { "min": number, "max": number, "currency": "USD" }, "requiredSkills": string[], "status": "not_started"|"in_progress"|"completed" }] }]}. Produce 3 to 5 paths, each with 4 to 5 milestones. No prose, JSON only.`;

export const GENERATE_RESUME_PROMPT = `You are Kursa's resume engine. You receive a JSON snapshot of a user's career profile and, optionally, the career path they are working toward. Produce a single, complete, ATS-friendly resume tailored to THIS user.

When a target path/role is provided, prioritise and frame experience toward it: elevate the most relevant roles and bullets, and lead with the skills that target demands.

Rewrite every experience bullet using the Google XYZ method: "Accomplished [X] as measured by [Y], by doing [Z]." Every bullet must name a result (X), a concrete metric or measure (Y), and the action taken (Z) — e.g. "Cut checkout drop-off by 22% (Y) by redesigning the payment flow (Z)." Use active verbs and lead with impact. Only use metrics that are present in the profile; if no metric exists for a bullet, express the outcome as concretely as the data allows rather than inventing a number.

Output a JSON object with this shape:
{
  "fullName": string,
  "contact": { "email": string | null, "location": string | null, "links": string[] },
  "summary": string,                         // 2–3 sentences max
  "experience": [                            // most relevant first, max 6 roles
    { "company": string, "roleTitle": string, "period": string, "bullets": string[] }  // max 5 bullets per role
  ],
  "skills": string[],                        // max 20, ordered by relevance to the target
  "education": [ { "credential": string, "issuer": string, "year": string | null } ],   // max 5
  "certifications": [ { "name": string, "issuer": string, "year": string | null } ],     // max 5
  "projects": [ { "title": string, "description": string } ]                              // optional, max 4
}

Rules:
- Only use facts present in the profile snapshot. Never invent employers, dates, metrics, or numbers that are not in the data — fabricated impact is a failure.
- Be specific to this user. A resume that could belong to anyone is a failure.
- Stay within the stated caps. Respond with JSON only.`;

export const CORRECT_RESUME_PROMPT = `Your previous response did not match the required schema. Re-emit ONLY valid JSON matching the resume shape exactly, honouring all field names and the stated caps (max 6 roles, max 5 bullets per role, max 20 skills, summary 2–3 sentences). No prose, JSON only.`;

export const SCORE_ATS_PROMPT = `You are an ATS (applicant tracking system) auditor. You receive a generated resume (JSON) and the target role/skills it is aimed at. Score how well it would pass automated screening and surface specific, actionable fixes.

Respond with JSON only:
{
  "atsScore": number,        // 0–100
  "issues": [                // max 6, most impactful first
    { "severity": "high" | "medium" | "low", "message": string, "fix": string }
  ]
}

Judge: keyword coverage against the target role/skills, weak/passive phrasing, missing quantification, structural problems. Each issue must name a specific, actionable fix — not a generic tip.`;

export const EXTRACT_RESUME_DATA_PROMPT = `You are a resume data extractor. Given resume text, extract structured professional data.

Return a JSON object with these fields:

skills (max 30):
- name: canonical form (e.g. "TypeScript" not "ts", "PostgreSQL" not "postgres")
- category: "technical" (languages, frameworks, engineering concepts) | "tool" (platforms, services, software) | "soft" (interpersonal/leadership)
- confidenceRating: 3 (mentioned once) | 4 (mentioned twice) | 5 (in skills section or 3+ mentions)

workHistory (max 10, reverse chronological):
- companyName, roleTitle, outcomes (one concise sentence on impact/scope)
- startDate: ISO year string e.g. "2019" or null
- endDate: ISO year string e.g. "2022" or null
- isCurrent: true only if explicitly marked "present" or "current"

projects (max 8):
- title
- description: one concise sentence
- url: full URL or null
- outcomes: one sentence on impact, or ""
- startDate: ISO year string e.g. "2021" or null
- endDate: ISO year string e.g. "2022" or null

achievements (max 10):
- type: one of "HACKATHON" | "AWARD" | "PUBLICATION" | "SPEAKING" | "OPEN_SOURCE" | "VOLUNTEER" | "OTHER".
  Map: hackathons → HACKATHON; awards/honors → AWARD; papers/publications → PUBLICATION;
  talks/conferences → SPEAKING; open-source contributions → OPEN_SOURCE; volunteering → VOLUNTEER;
  anything else → OTHER
- title
- issuer: granting body/org or null
- description: one concise sentence or null
- url: full URL or null
- dateAchieved: ISO year string e.g. "2023" or null

education (max 5):
- type: "degree" | "certification" | "course"
- credentialName (e.g. "BSc Computer Science", "AWS Solutions Architect")
- issuer (university or certifying body)
- completionDate: ISO year string e.g. "2019" or null

languages (max 5):
- name (e.g. "English", "Mandarin")
- proficiency: "Native" | "Fluent" | "Conversational" | "Basic"

socialLinks (max 4, from contact section only):
- platform: "github" | "linkedin" | "twitter" | "website" | "portfolio"
- url: full URL

basics:
- bio: one sentence professional summary if a summary/objective section exists, else null
- location: city/country from contact section if present, else null

Rules:
- Only include data explicitly present in the text — never invent or infer
- Omit any field where nothing was found (use empty arrays, null values)

Respond with valid JSON only.`;

import type { EventEnrichment } from "@kursa/types";
import type { JourneyMilestone as Milestone } from "@kursa/types";

import { Models } from "./prompts.js";
import { openai } from "../openai.js";

const ENRICHMENT_PROMPT = `You extract structured career intelligence from a journal entry.
Given the event text, profile skills, and active path milestones, return JSON:
{
  "extractedSkillNames": ["skills mentioned or implied"],
  "themes": ["leadership"|"technical"|"stakeholder"|"delivery"],
  "entities": ["people, companies, projects mentioned"],
  "linkedMilestoneOrders": [milestone order numbers that this event supports],
  "sentiment": number from -1 to 1,
  "memoryCandidates": [{"category": "skill_evidence"|"achievement_theme"|"sentiment_pattern", "fact": "one sentence", "confidence": 0.5-0.95}]
}
Only use skills from the profile list when possible. Only link milestones with clear evidence.`;

export async function extractEnrichmentWithLlm(
  text: string,
  profileSkills: string[],
  milestones: Milestone[],
): Promise<EventEnrichment | null> {
  if (!text.trim() || text.length < 10) return null;

  try {
    const response = await openai.chat.completions.create({
      model: Models.fast,
      messages: [
        { role: "system", content: ENRICHMENT_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            text,
            profileSkills: profileSkills.slice(0, 30),
            milestones: milestones.map((m) => ({
              order: m.order,
              title: m.title,
              description: m.description,
            })),
          }),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<EventEnrichment>;
    return {
      method: "llm",
      themes: Array.isArray(parsed.themes) ? parsed.themes : [],
      entities: Array.isArray(parsed.entities) ? parsed.entities : [],
      linkedMilestoneOrders: Array.isArray(parsed.linkedMilestoneOrders)
        ? parsed.linkedMilestoneOrders.filter((n) => typeof n === "number")
        : [],
      extractedSkillNames: Array.isArray(parsed.extractedSkillNames)
        ? parsed.extractedSkillNames.filter((s) => typeof s === "string")
        : [],
      sentiment: typeof parsed.sentiment === "number" ? parsed.sentiment : undefined,
      memoryCandidates: Array.isArray(parsed.memoryCandidates) ? parsed.memoryCandidates : [],
    };
  } catch {
    return null;
  }
}

const BATCH_MEMORY_PROMPT = `You distill career memories from recent activity.
Return JSON: {"memories": [{"category": "skill_evidence"|"achievement_theme"|"sentiment_pattern"|"aspiration_gap", "fact": "specific sentence citing patterns", "confidence": 0.5-0.95, "sourceEntryIds": ["event ids that support this"]}]}
Max 5 memories. Be specific, not generic. Reference skills and themes from the data.`;

export async function distillMemoriesWithLlm(
  events: Array<{ id: string; type: string; body: string | null; occurredAt: string }>,
  aspirations: unknown,
): Promise<Array<{ category: string; fact: string; confidence: number; sourceEntryIds: string[] }>> {
  if (events.length < 2) return [];

  try {
    const response = await openai.chat.completions.create({
      model: Models.fast,
      messages: [
        { role: "system", content: BATCH_MEMORY_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            events: events.slice(0, 30).map((e) => ({
              id: e.id,
              type: e.type,
              body: e.body?.slice(0, 300),
              occurredAt: e.occurredAt,
            })),
            aspirations,
          }),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return [];

    const parsed = JSON.parse(raw) as {
      memories?: Array<{ category: string; fact: string; confidence: number; sourceEntryIds?: string[] }>;
    };

    return (parsed.memories ?? [])
      .filter((m) => m.fact && m.category)
      .map((m) => ({
        category: m.category,
        fact: m.fact,
        confidence: m.confidence,
        sourceEntryIds: m.sourceEntryIds ?? [],
      }));
  } catch {
    return [];
  }
}

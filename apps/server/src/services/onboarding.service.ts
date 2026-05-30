import prisma from "@kursa/db";

import type { CompleteOnboardingInput } from "../validators/onboarding.validator.js";
import { ingestEvent } from "./events.service.js";

export async function getOnboardingStatus(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { onboardingDone: true },
  });
  return {
    onboardingDone: profile?.onboardingDone ?? false,
    hasProfile: profile !== null,
  };
}

function dedupeSkills(skills: CompleteOnboardingInput["skills"]) {
  const seen = new Set<string>();
  const out: typeof skills = [];
  for (const skill of skills) {
    const key = skill.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ ...skill, name: skill.name.trim() });
  }
  return out;
}

function dedupeWorkHistory(items: CompleteOnboardingInput["workHistory"]) {
  const seen = new Set<string>();
  const out: typeof items = [];
  for (const item of items) {
    const key = `${item.companyName.trim().toLowerCase()}__${item.roleTitle.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      ...item,
      companyName: item.companyName.trim(),
      roleTitle: item.roleTitle.trim(),
      outcomes: item.outcomes.trim(),
    });
  }
  return out;
}

function parseYearDate(value: string | null | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const year = parseInt(value.slice(0, 4), 10);
  if (Number.isFinite(year) && year > 1970 && year < 2100) {
    return new Date(`${year}-01-01`);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export async function completeOnboarding(userId: string, input: CompleteOnboardingInput): Promise<void> {
  const dedupedSkills = dedupeSkills(input.skills);
  const dedupedWorkHistory = dedupeWorkHistory(input.workHistory);

  if (dedupedSkills.length === 0) throw new Error("Add at least one skill before finishing.");
  if (dedupedWorkHistory.length === 0) throw new Error("Add at least one work experience entry.");

  const profile = await prisma.profile.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true, values: true },
  });

  const previousValues =
    profile.values && typeof profile.values === "object" && !Array.isArray(profile.values)
      ? (profile.values as Record<string, unknown>)
      : {};

  const mergedValues = {
    ...previousValues,
    layer1Values: input.values,
    imports: input.imports,
  };

  const fallbackDate = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.profile.update({
      where: { id: profile.id },
      data: {
        targetRole: input.basics.targetRole,
        location: input.basics.location,
        yearsOfExperience: input.basics.yearsOfExperience,
        bio: input.basics.bio,
        values: mergedValues as never,
        aspirations: input.aspirations as never,
        onboardingDone: true,
      },
    });

    await tx.skill.deleteMany({ where: { profileId: profile.id } });
    await tx.skill.createMany({
      data: dedupedSkills.map((skill) => ({
        profileId: profile.id,
        name: skill.name,
        category: skill.category,
        confidenceRating: skill.confidenceRating,
        source: skill.source === "resume" ? "resume" : "self_reported",
      })),
      skipDuplicates: true,
    });

    await tx.workHistory.deleteMany({ where: { profileId: profile.id } });
    for (const item of dedupedWorkHistory) {
      const startDate = parseYearDate(item.startDate, fallbackDate);
      const endDate = item.isCurrent ? null : item.endDate ? parseYearDate(item.endDate, fallbackDate) : null;
      await tx.workHistory.create({
        data: {
          profileId: profile.id,
          companyName: item.companyName,
          roleTitle: item.roleTitle,
          startDate,
          endDate,
          isCurrent: item.isCurrent ?? false,
          outcomes: { text: item.outcomes } as never,
        },
      });
    }

    await tx.education.deleteMany({ where: { profileId: profile.id } });
    for (const ed of input.education) {
      await tx.education.create({
        data: {
          profileId: profile.id,
          type: ed.type,
          credentialName: ed.credentialName,
          issuer: ed.issuer,
          completionDate: ed.completionDate ? parseYearDate(ed.completionDate, fallbackDate) : null,
        },
      });
    }

    await tx.language.deleteMany({ where: { profileId: profile.id } });
    for (const lang of input.languages) {
      await tx.language.create({
        data: {
          profileId: profile.id,
          name: lang.name,
          proficiency: lang.proficiency,
        },
      });
    }

    await tx.socialLink.deleteMany({ where: { profileId: profile.id } });
    for (const link of input.socialLinks) {
      await tx.socialLink.create({
        data: {
          profileId: profile.id,
          platform: link.platform,
          url: link.url,
        },
      });
    }
  });

  if (input.imports.resumeFileName || input.imports.resumeRawText) {
    await ingestEvent(userId, {
      type: "profile_import",
      source: "system",
      body: `Resume imported: ${input.imports.resumeFileName || "upload"}`,
      structured: {
        resumeFileName: input.imports.resumeFileName,
        skillCount: dedupedSkills.length,
        workHistoryCount: dedupedWorkHistory.length,
      },
      skipDelta: true,
      skipDistill: true,
    });
  }

  await ingestEvent(userId, {
    type: "onboarding_complete",
    source: "system",
    body: "Onboarding completed",
    structured: {
      skillCount: dedupedSkills.length,
      workHistoryCount: dedupedWorkHistory.length,
    },
    skipDelta: true,
    skipDistill: true,
  });
}

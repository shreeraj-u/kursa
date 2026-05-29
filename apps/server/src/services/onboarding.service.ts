import prisma from "@kursa/db";

import type { CompleteOnboardingInput } from "../validators/onboarding.validator.js";

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
      companyName: item.companyName.trim(),
      roleTitle: item.roleTitle.trim(),
      outcomes: item.outcomes.trim(),
    });
  }
  return out;
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

  const now = new Date();

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
      })),
      skipDuplicates: true,
    });

    await tx.workHistory.deleteMany({ where: { profileId: profile.id } });
    for (const item of dedupedWorkHistory) {
      await tx.workHistory.create({
        data: {
          profileId: profile.id,
          companyName: item.companyName,
          roleTitle: item.roleTitle,
          startDate: now,
          endDate: null,
          isCurrent: false,
          outcomes: { text: item.outcomes } as never,
        },
      });
    }
  });
}

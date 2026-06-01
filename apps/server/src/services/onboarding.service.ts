import prisma from "@kursa/db";

import type { CompleteOnboardingInput } from "../validators/onboarding.validator.js";
import { ingestEvent } from "./career-event-intelligence/index.js";

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
      startDate: item.startDate,
      endDate: item.endDate,
      isCurrent: item.isCurrent,
    });
  }
  return out;
}

function dedupeSocialLinks(items: CompleteOnboardingInput["socialLinks"]) {
  const seen = new Set<string>();
  const out: typeof items = [];
  for (const item of items) {
    const key = `${item.platform.trim().toLowerCase()}__${item.url.trim().toLowerCase()}`;
    if (!item.url.trim() || seen.has(key)) continue;
    seen.add(key);
    out.push({ platform: item.platform.trim(), url: item.url.trim() });
  }
  return out;
}

function yearToDate(s: string | null): Date | null {
  if (!s) return null;
  const trimmed = s.trim();
  if (!trimmed) return null;
  const parsed = new Date(/^\d{4}$/.test(trimmed) ? `${trimmed}-01-01` : trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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
        source:
          skill.source === "resume" ? "resume" : "self_reported",
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
          startDate: yearToDate(item.startDate) ?? (() => { throw new Error("Work history start year is required."); })(),
          endDate: yearToDate(item.endDate),
          isCurrent: item.isCurrent,
          outcomes: { text: item.outcomes } as never,
        },
      });
    }

    const education = input.education ?? [];
    await tx.education.deleteMany({ where: { profileId: profile.id } });
    for (const item of education) {
      await tx.education.create({
        data: {
          profileId: profile.id,
          type: item.type,
          credentialName: item.credentialName,
          issuer: item.issuer,
          completionDate: yearToDate(item.completionDate),
        },
      });
    }

    const languages = input.languages ?? [];
    await tx.language.deleteMany({ where: { profileId: profile.id } });
    for (const item of languages) {
      await tx.language.create({
        data: {
          profileId: profile.id,
          name: item.name,
          proficiency: item.proficiency,
        },
      });
    }

    const socialLinks = dedupeSocialLinks(input.socialLinks ?? []);
    await tx.socialLink.deleteMany({ where: { profileId: profile.id } });
    for (const item of socialLinks) {
      await tx.socialLink.create({
        data: {
          profileId: profile.id,
          platform: item.platform,
          url: item.url,
        },
      });
    }

    const projects = input.projects ?? [];
    await tx.project.deleteMany({ where: { profileId: profile.id } });
    for (const item of projects) {
      await tx.project.create({
        data: {
          profileId: profile.id,
          title: item.title,
          description: item.description,
          url: item.url,
          startDate: yearToDate(item.startDate),
          endDate: yearToDate(item.endDate),
          outcomes: { text: item.outcomes } as never,
        },
      });
    }

    const achievements = input.achievements ?? [];
    await tx.achievement.deleteMany({ where: { profileId: profile.id } });
    for (const item of achievements) {
      await tx.achievement.create({
        data: {
          profileId: profile.id,
          type: item.type,
          title: item.title,
          issuer: item.issuer,
          description: item.description,
          url: item.url,
          dateAchieved: yearToDate(item.dateAchieved),
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

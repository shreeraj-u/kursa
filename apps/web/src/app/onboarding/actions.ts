"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import prisma from "@kursa/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import { extractResumeText } from "./imports/extract-text";
import { parseResumeText } from "./imports/resume";
import { onboardingPayloadSchema, type SkillCategory } from "./schema";

export type ImportedSkill = {
  name: string;
  category: SkillCategory;
  confidenceRating: number;
};

async function requireSessionUser() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session?.user) {
    redirect("/login");
  }

  return session.user;
}

async function getOrCreateProfile(userId: string) {
  return prisma.profile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asJson(value: Record<string, unknown>): never {
  return value as never;
}

export type OnboardingStatus = {
  onboardingDone: boolean;
  hasProfile: boolean;
};

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const user = await requireSessionUser();
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { onboardingDone: true },
  });
  return {
    onboardingDone: profile?.onboardingDone ?? false,
    hasProfile: profile !== null,
  };
}

export type ResumeUploadResult = {
  resumeFileName: string;
  rawText: string;
  importedSkills: ImportedSkill[];
  skillsFound: number;
};

const MAX_RESUME_BYTES = 8 * 1024 * 1024; // 8MB

export async function uploadResumeFile(formData: FormData): Promise<ResumeUploadResult> {
  const user = await requireSessionUser();

  const file = formData.get("resume");
  if (!(file instanceof File)) {
    throw new Error("A resume file is required.");
  }

  if (file.size === 0) {
    throw new Error("That file looks empty.");
  }

  if (file.size > MAX_RESUME_BYTES) {
    throw new Error("That file is too large (max 8MB).");
  }

  // extractResumeText validates the extension and pulls real text out of
  // PDF/DOCX/TXT files (PDFs and DOCX are not plain UTF-8).
  const { text } = await extractResumeText(file);

  // Persist the original file for later re-processing/audit.
  const uploadDirectory = path.join(process.cwd(), "uploads", "resumes");
  await mkdir(uploadDirectory, { recursive: true });
  const safeFileName = file.name.replaceAll(/\s+/g, "_");
  const persistedName = `${user.id}-${Date.now()}-${safeFileName}`;
  const savedPath = path.join(uploadDirectory, persistedName);
  await writeFile(savedPath, Buffer.from(await file.arrayBuffer()));

  const parsed = parseResumeText(text);

  return {
    resumeFileName: persistedName,
    rawText: parsed.rawText.slice(0, 20_000),
    importedSkills: parsed.skills.map((skill) => ({
      name: skill.name,
      category: skill.category,
      confidenceRating: skill.confidenceRating,
    })),
    skillsFound: parsed.skills.length,
  };
}

type DedupedSkill = {
  name: string;
  category: SkillCategory;
  confidenceRating: number;
};

type DedupedWorkHistory = {
  companyName: string;
  roleTitle: string;
  outcomes: string;
};

function dedupeSkills(
  skills: Array<{ name: string; category: SkillCategory; confidenceRating: number }>,
): DedupedSkill[] {
  const seen = new Set<string>();
  const deduped: DedupedSkill[] = [];
  for (const skill of skills) {
    const key = skill.name.trim().toLowerCase();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push({
      name: skill.name.trim(),
      category: skill.category,
      confidenceRating: skill.confidenceRating,
    });
  }
  return deduped;
}

function dedupeWorkHistory(
  items: Array<{ companyName: string; roleTitle: string; outcomes: string }>,
): DedupedWorkHistory[] {
  const seen = new Set<string>();
  const deduped: DedupedWorkHistory[] = [];
  for (const item of items) {
    const key = `${item.companyName.trim().toLowerCase()}__${item.roleTitle.trim().toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push({
      companyName: item.companyName.trim(),
      roleTitle: item.roleTitle.trim(),
      outcomes: item.outcomes.trim(),
    });
  }
  return deduped;
}

export async function saveOnboarding(payload: unknown): Promise<{ ok: true }> {
  const user = await requireSessionUser();
  const parsed = onboardingPayloadSchema.parse(payload);

  const dedupedSkills = dedupeSkills(parsed.skills);
  const dedupedWorkHistory = dedupeWorkHistory(parsed.workHistory);

  if (dedupedSkills.length === 0) {
    throw new Error("Add at least one skill before finishing.");
  }
  if (dedupedWorkHistory.length === 0) {
    throw new Error("Add at least one work experience entry.");
  }

  await getOrCreateProfile(user.id);
  const existingProfile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { id: true, values: true },
  });

  if (!existingProfile) {
    throw new Error("Profile not found.");
  }

  const profileId = existingProfile.id;
  const previousValues = asRecord(existingProfile.values);
  const mergedValues = {
    ...previousValues,
    layer1Values: parsed.values,
    imports: parsed.imports,
  };

  await prisma.$transaction(async (tx) => {
    await tx.profile.update({
      where: { id: profileId },
      data: {
        targetRole: parsed.basics.targetRole,
        location: parsed.basics.location,
        yearsOfExperience: parsed.basics.yearsOfExperience,
        bio: parsed.basics.bio,
        values: asJson(mergedValues),
        aspirations: asJson(parsed.aspirations),
        onboardingDone: true,
      },
    });

    await tx.skill.deleteMany({ where: { profileId } });
    await tx.skill.createMany({
      data: dedupedSkills.map((skill) => ({
        profileId,
        name: skill.name,
        category: skill.category,
        confidenceRating: skill.confidenceRating,
      })),
      skipDuplicates: true,
    });

    await tx.workHistory.deleteMany({ where: { profileId } });
    const now = new Date();
    for (const item of dedupedWorkHistory) {
      await tx.workHistory.create({
        data: {
          profileId,
          companyName: item.companyName,
          roleTitle: item.roleTitle,
          // Dates are intentionally captured later (after onboarding).
          startDate: now,
          endDate: null,
          isCurrent: false,
          outcomes: asJson({ text: item.outcomes }),
        },
      });
    }
  });

  return { ok: true };
}

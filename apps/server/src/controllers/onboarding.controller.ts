import type { Request, Response } from "express";
import { z } from "zod";

import { Errors } from "../errors/http-error.js";
import { extractResumeText } from "../lib/extract-text.js";
import { parseResumeText } from "../lib/resume-parser.js";
import { ok } from "../lib/respond.js";
import { reviewOnboardingDraft } from "../lib/onboarding-review.js";
import * as onboardingService from "../services/onboarding.service.js";
import { completeOnboardingSchema } from "../validators/onboarding.validator.js";

const MAX_RESUME_BYTES = 8 * 1024 * 1024;

export async function getStatus(req: Request, res: Response): Promise<void> {
  const status = await onboardingService.getOnboardingStatus(req.user!.id);
  ok(res, status);
}

export async function review(req: Request, res: Response): Promise<void> {
  const reviewResult = await reviewOnboardingDraft(req.body);
  ok(res, reviewResult);
}

export async function complete(req: Request, res: Response): Promise<void> {
  const parsed = completeOnboardingSchema.safeParse(req.body);
  if (!parsed.success) {
    throw Errors.badRequest("Invalid onboarding payload", z.flattenError(parsed.error));
  }
  await onboardingService.completeOnboarding(req.user!.id, parsed.data);
  ok(res, { ok: true });
}

export async function uploadResume(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    throw Errors.badRequest("A resume file is required.");
  }
  if (file.size > MAX_RESUME_BYTES) {
    throw Errors.badRequest("That file is too large (max 8MB).");
  }

  const { text } = await extractResumeText(file.buffer, file.originalname);
  const parsed = await parseResumeText(text);

  ok(res, {
    importedSkills: parsed.skills.map(({ name, category, confidenceRating }) => ({
      name,
      category,
      confidenceRating,
    })),
    importedWorkHistory: parsed.workHistory,
    importedProjects: parsed.projects,
    importedAchievements: parsed.achievements,
    importedEducation: parsed.education,
    importedLanguages: parsed.languages,
    importedSocialLinks: parsed.socialLinks,
    importedBasics: parsed.basics,
    skillsFound: parsed.skills.length,
    extractionMethod: parsed.extractionMethod,
    warnings: parsed.warnings,
    resumeFileName: file.originalname,
    rawText: text,
  });
}

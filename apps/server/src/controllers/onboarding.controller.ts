import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Request, Response } from "express";
import { z } from "zod";

import { Errors } from "../errors/http-error.js";
import { extractResumeText } from "../lib/extract-text.js";
import { parseResumeText } from "../lib/resume-parser.js";
import { ok } from "../lib/respond.js";
import * as onboardingService from "../services/onboarding.service.js";
import { completeOnboardingSchema } from "../validators/onboarding.validator.js";

const MAX_RESUME_BYTES = 8 * 1024 * 1024;

export async function getStatus(req: Request, res: Response): Promise<void> {
  const status = await onboardingService.getOnboardingStatus(req.user!.id);
  ok(res, status);
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

  const uploadDir = path.join(process.cwd(), "uploads", "resumes");
  await mkdir(uploadDir, { recursive: true });
  const safeName = file.originalname.replaceAll(/\s+/g, "_");
  const persistedName = `${req.user!.id}-${Date.now()}-${safeName}`;
  await writeFile(path.join(uploadDir, persistedName), file.buffer);

  ok(res, {
    resumeFileName: persistedName,
    rawText: parsed.rawText.slice(0, 20_000),
    importedSkills: parsed.skills.map(({ name, category, confidenceRating }) => ({
      name,
      category,
      confidenceRating,
    })),
    importedWorkHistory: parsed.workHistory,
    importedEducation: parsed.education,
    importedLanguages: parsed.languages,
    importedSocialLinks: parsed.socialLinks,
    importedBasics: parsed.basics,
    skillsFound: parsed.skills.length,
  });
}

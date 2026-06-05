import type { Request, Response } from "express";
import type { ZodSchema } from "zod";

import { z } from "zod";
import { Errors } from "../errors/http-error.js";
import { ok, created } from "../lib/respond.js";
import * as profileService from "../services/profile.service.js";
import * as insightsService from "../services/insights.service.js";
import { ingestEvent } from "../services/career-event-intelligence/index.js";
import {
  profileUpdateSchema,
  socialLinkCreateSchema,
  socialLinkUpdateSchema,
  skillCreateSchema,
  skillUpdateSchema,
  learningGoalCreateSchema,
  learningGoalUpdateSchema,
  workHistoryCreateSchema,
  workHistoryUpdateSchema,
  projectCreateSchema,
  projectUpdateSchema,
  achievementCreateSchema,
  achievementUpdateSchema,
  educationCreateSchema,
  educationUpdateSchema,
  languageCreateSchema,
  languageUpdateSchema,
} from "../validators/profile.validator.js";

function parseOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw Errors.badRequest("Invalid request body", z.flattenError(result.error));
  return result.data;
}

/**
 * GET /api/v1/profile/me
 */
export async function getMe(
  req: Request,
  res: Response,
): Promise<void> {
  const profile = await profileService.getProfile(req.user!.id);
  ok(res, { profile });
}

/**
 * PUT /api/v1/profile/me
 */
export async function updateMe(
  req: Request,
  res: Response,
): Promise<void> {
  const data = parseOrThrow(profileUpdateSchema, req.body);
  const profile = await profileService.upsertProfile(req.user!.id, data);
  ok(res, { profile });
}


/**
 * POST /api/v1/profile/me/dashboard-guide/dismiss
 */
export async function dismissDashboardGuide(
  req: Request,
  res: Response,
): Promise<void> {
  const dashboardGuideCompletedAt = await profileService.dismissDashboardGuide(req.user!.id);
  ok(res, { dashboardGuideCompletedAt });
}

/**
 * GET /api/v1/profile/me/observations
 */
export async function getObservations(
  req: Request,
  res: Response,
): Promise<void> {
  const parsedPage = parseInt(req.query.page as string, 10);
  const parsedLimit = parseInt(req.query.limit as string, 10);

  const page = !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const limit = !isNaN(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 50) : 4;

  const observations = await insightsService.getObservations(req.user!.id, page, limit);
  if (!observations) {
    throw Errors.notFound("Profile");
  }

  ok(res, observations);
}

/**
 * POST /api/v1/profile/me/social-links
 */
export async function createSocialLink(
  req: Request,
  res: Response,
): Promise<void> {
  const data = parseOrThrow(socialLinkCreateSchema, req.body);
  const socialLink = await profileService.createSocialLink(req.user!.id, data);
  created(res, { socialLink });
}

/**
 * PUT /api/v1/profile/me/social-links/:id
 */
export async function updateSocialLink(
  req: Request,
  res: Response,
): Promise<void> {
  const data = parseOrThrow(socialLinkUpdateSchema, req.body);
  const socialLink = await profileService.updateSocialLink(req.user!.id, req.params.id as string, data);
  ok(res, { socialLink });
}

/**
 * DELETE /api/v1/profile/me/social-links/:id
 */
export async function deleteSocialLink(
  req: Request,
  res: Response,
): Promise<void> {
  await profileService.deleteSocialLink(req.user!.id, req.params.id as string);
  ok(res, { deleted: true });
}

// ── Skill inventory ─────────────────────────────────────────────────────────────

/**
 * POST /api/v1/profile/me/skills
 */
export async function createSkill(req: Request, res: Response): Promise<void> {
  const data = parseOrThrow(skillCreateSchema, req.body);
  const skill = await profileService.createSkill(req.user!.id, data);
  created(res, { skill });
}

/**
 * PATCH /api/v1/profile/me/skills/:id
 */
export async function updateSkill(req: Request, res: Response): Promise<void> {
  const data = parseOrThrow(skillUpdateSchema, req.body);
  const skill = await profileService.updateSkill(req.user!.id, req.params.id as string, data);
  ok(res, { skill });
}

/**
 * DELETE /api/v1/profile/me/skills/:id
 */
export async function deleteSkill(req: Request, res: Response): Promise<void> {
  await profileService.deleteSkill(req.user!.id, req.params.id as string);
  ok(res, { deleted: true });
}

// ── Learning goals ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/profile/me/learning-goals
 */
export async function createLearningGoal(req: Request, res: Response): Promise<void> {
  const data = parseOrThrow(learningGoalCreateSchema, req.body);
  const learningGoal = await profileService.createLearningGoal(req.user!.id, data);

  if (data.gapPriority) {
    ingestEvent(req.user!.id, {
      type: "learning",
      source: "user",
      body: `Identified skill gap: ${data.skillName} (${data.gapPriority} priority${data.pathTitle ? ` for ${data.pathTitle}` : ""})`,
      structured: {
        skillName: data.skillName,
        gapPriority: data.gapPriority,
        pathTitle: data.pathTitle,
        whyItMatters: data.whyItMatters,
        context: "gap_tracking",
      },
      skipDelta: true,
    }).catch((err: unknown) => {
      console.warn("[gap_tracking] ingestEvent failed silently:", err);
    });
  }

  created(res, { learningGoal });
}

/**
 * PATCH /api/v1/profile/me/learning-goals/:id
 */
export async function updateLearningGoal(req: Request, res: Response): Promise<void> {
  const data = parseOrThrow(learningGoalUpdateSchema, req.body);
  const learningGoal = await profileService.updateLearningGoal(req.user!.id, req.params.id as string, data);
  ok(res, { learningGoal });
}

/**
 * DELETE /api/v1/profile/me/learning-goals/:id
 */
export async function deleteLearningGoal(req: Request, res: Response): Promise<void> {
  await profileService.deleteLearningGoal(req.user!.id, req.params.id as string);
  ok(res, { deleted: true });
}

// ── Work history ────────────────────────────────────────────────────────────────

export async function createWorkHistory(req: Request, res: Response): Promise<void> {
  const data = parseOrThrow(workHistoryCreateSchema, req.body);
  const workHistory = await profileService.createWorkHistory(req.user!.id, data);
  created(res, { workHistory });
}

export async function updateWorkHistory(req: Request, res: Response): Promise<void> {
  const data = parseOrThrow(workHistoryUpdateSchema, req.body);
  const workHistory = await profileService.updateWorkHistory(req.user!.id, req.params.id as string, data);
  ok(res, { workHistory });
}

export async function deleteWorkHistory(req: Request, res: Response): Promise<void> {
  await profileService.deleteWorkHistory(req.user!.id, req.params.id as string);
  ok(res, { deleted: true });
}

// ── Projects ────────────────────────────────────────────────────────────────────

export async function createProject(req: Request, res: Response): Promise<void> {
  const data = parseOrThrow(projectCreateSchema, req.body);
  const project = await profileService.createProject(req.user!.id, data);
  created(res, { project });
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  const data = parseOrThrow(projectUpdateSchema, req.body);
  const project = await profileService.updateProject(req.user!.id, req.params.id as string, data);
  ok(res, { project });
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  await profileService.deleteProject(req.user!.id, req.params.id as string);
  ok(res, { deleted: true });
}

// ── Achievements ────────────────────────────────────────────────────────────────

export async function createAchievement(req: Request, res: Response): Promise<void> {
  const data = parseOrThrow(achievementCreateSchema, req.body);
  const achievement = await profileService.createAchievement(req.user!.id, data);
  created(res, { achievement });
}

export async function updateAchievement(req: Request, res: Response): Promise<void> {
  const data = parseOrThrow(achievementUpdateSchema, req.body);
  const achievement = await profileService.updateAchievement(req.user!.id, req.params.id as string, data);
  ok(res, { achievement });
}

export async function deleteAchievement(req: Request, res: Response): Promise<void> {
  await profileService.deleteAchievement(req.user!.id, req.params.id as string);
  ok(res, { deleted: true });
}

// ── Education ───────────────────────────────────────────────────────────────────

export async function createEducation(req: Request, res: Response): Promise<void> {
  const data = parseOrThrow(educationCreateSchema, req.body);
  const education = await profileService.createEducation(req.user!.id, data);
  created(res, { education });
}

export async function updateEducation(req: Request, res: Response): Promise<void> {
  const data = parseOrThrow(educationUpdateSchema, req.body);
  const education = await profileService.updateEducation(req.user!.id, req.params.id as string, data);
  ok(res, { education });
}

export async function deleteEducation(req: Request, res: Response): Promise<void> {
  await profileService.deleteEducation(req.user!.id, req.params.id as string);
  ok(res, { deleted: true });
}

// ── Languages ───────────────────────────────────────────────────────────────────

export async function createLanguage(req: Request, res: Response): Promise<void> {
  const data = parseOrThrow(languageCreateSchema, req.body);
  const language = await profileService.createLanguage(req.user!.id, data);
  created(res, { language });
}

export async function updateLanguage(req: Request, res: Response): Promise<void> {
  const data = parseOrThrow(languageUpdateSchema, req.body);
  const language = await profileService.updateLanguage(req.user!.id, req.params.id as string, data);
  ok(res, { language });
}

export async function deleteLanguage(req: Request, res: Response): Promise<void> {
  await profileService.deleteLanguage(req.user!.id, req.params.id as string);
  ok(res, { deleted: true });
}

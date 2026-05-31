import type { Request, Response } from "express";

import { Errors } from "../errors/http-error.js";
import { ok, created } from "../lib/respond.js";
import * as profileService from "../services/profile.service.js";
import * as insightsService from "../services/insights.service.js";
import { z } from "zod";
import {
  profileUpdateSchema,
  socialLinkCreateSchema,
  socialLinkUpdateSchema,
  skillCreateSchema,
  skillUpdateSchema,
  learningGoalCreateSchema,
  learningGoalUpdateSchema,
} from "../validators/profile.validator.js";

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
  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw Errors.badRequest("Invalid request body", z.flattenError(parsed.error));
  }

  const profile = await profileService.upsertProfile(req.user!.id, parsed.data);
  ok(res, { profile });
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
  const parsed = socialLinkCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw Errors.badRequest("Invalid request body", z.flattenError(parsed.error));
  }
  const socialLink = await profileService.createSocialLink(req.user!.id, parsed.data);
  created(res, { socialLink });
}

/**
 * PUT /api/v1/profile/me/social-links/:id
 */
export async function updateSocialLink(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = socialLinkUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw Errors.badRequest("Invalid request body", z.flattenError(parsed.error));
  }
  const socialLink = await profileService.updateSocialLink(req.user!.id, req.params.id as string, parsed.data);
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
  const parsed = skillCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw Errors.badRequest("Invalid request body", z.flattenError(parsed.error));
  }
  const skill = await profileService.createSkill(req.user!.id, parsed.data);
  created(res, { skill });
}

/**
 * PATCH /api/v1/profile/me/skills/:id
 */
export async function updateSkill(req: Request, res: Response): Promise<void> {
  const parsed = skillUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw Errors.badRequest("Invalid request body", z.flattenError(parsed.error));
  }
  const skill = await profileService.updateSkill(req.user!.id, req.params.id as string, parsed.data);
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
  const parsed = learningGoalCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw Errors.badRequest("Invalid request body", z.flattenError(parsed.error));
  }
  const learningGoal = await profileService.createLearningGoal(req.user!.id, parsed.data);
  created(res, { learningGoal });
}

/**
 * PATCH /api/v1/profile/me/learning-goals/:id
 */
export async function updateLearningGoal(req: Request, res: Response): Promise<void> {
  const parsed = learningGoalUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw Errors.badRequest("Invalid request body", z.flattenError(parsed.error));
  }
  const learningGoal = await profileService.updateLearningGoal(
    req.user!.id,
    req.params.id as string,
    parsed.data,
  );
  ok(res, { learningGoal });
}

/**
 * DELETE /api/v1/profile/me/learning-goals/:id
 */
export async function deleteLearningGoal(req: Request, res: Response): Promise<void> {
  await profileService.deleteLearningGoal(req.user!.id, req.params.id as string);
  ok(res, { deleted: true });
}

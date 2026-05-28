import type { Request, Response } from "express";

import { Errors } from "../errors/http-error.js";
import { ok } from "../lib/respond.js";
import * as profileService from "../services/profile.service.js";
import { profileUpdateSchema } from "../validators/profile.validator.js";

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
    throw Errors.badRequest("Invalid request body", parsed.error.flatten());
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
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 4;

  const observations = await profileService.getObservations(req.user!.id, page, limit);
  if (!observations) {
    throw Errors.notFound("Profile");
  }

  ok(res, observations);
}

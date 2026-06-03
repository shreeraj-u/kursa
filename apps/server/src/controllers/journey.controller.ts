import type { Request, Response } from "express";

import { z } from "zod";
import { journeyPreferencesSchema } from "@kursa/types";
import { Errors } from "../errors/http-error.js";
import { ok } from "../lib/respond.js";
import * as journeyService from "../services/journey.service.js";

const milestoneStatusSchema = z.enum(["not_started", "in_progress", "completed"]).nullable();
const generateJourneySchema = z.object({
  journeyPreferences: journeyPreferencesSchema.optional(),
});

/**
 * GET /api/v1/profile/me/journey
 * Returns the user's career journey with its computed timeline and action queue.
 */
export async function getJourney(req: Request, res: Response): Promise<void> {
  const data = await journeyService.getJourney(req.user!.id);
  ok(res, data);
}

/**
 * POST /api/v1/profile/me/journey/generate
 * Generates the user's single best-fit career journey (replaces any existing one).
 */
export async function generateJourney(req: Request, res: Response): Promise<void> {
  const parsed = generateJourneySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw Errors.badRequest("Invalid journey preferences", z.flattenError(parsed.error));
  }

  const journey = await journeyService.generateJourney(req.user!.id, parsed.data.journeyPreferences);
  if (journey === null) throw Errors.notFound("Profile");
  ok(res, { journey });
}

/**
 * PATCH /api/v1/profile/me/journey/milestones/:order
 * Body: { status: MilestoneStatus | null }  (null = clear manual override; status may be re-inferred later)
 * Completing the final milestone auto-extends the journey.
 */
export async function updateMilestoneStatus(req: Request, res: Response): Promise<void> {
  const order = parseInt(req.params.order as string, 10);
  if (isNaN(order)) throw Errors.badRequest("Milestone order must be a number");

  const parsed = milestoneStatusSchema.safeParse(req.body.status ?? null);
  if (!parsed.success) throw Errors.badRequest("Invalid status value");

  const journey = await journeyService.updateMilestoneStatus(req.user!.id, order, parsed.data);
  if (journey === null) throw Errors.notFound("Career journey");
  ok(res, { journey });
}

/**
 * POST /api/v1/profile/me/journey/extend
 * Appends AI-generated continuation milestones to the user's journey.
 */
export async function extendJourney(req: Request, res: Response): Promise<void> {
  const journey = await journeyService.autoExtend(req.user!.id);
  if (journey === null) throw Errors.notFound("Career journey");
  ok(res, { journey });
}

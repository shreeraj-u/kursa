import type { Request, Response } from "express";

import { z } from "zod";
import {
  journeyPreferencesSchema,
  journeyRevisionBriefSchema,
  type JourneyRevisionBrief,
} from "@kursa/types";
import { Errors } from "../errors/http-error.js";
import { ok } from "../lib/respond.js";
import * as journeyService from "../services/journey.service.js";
import * as intakeService from "../services/journey-intake.service.js";
import * as reviseService from "../services/journey-revise.service.js";
import * as setupService from "../services/journey-setup.service.js";

const milestoneStatusSchema = z.enum(["not_started", "in_progress", "completed"]).nullable();
const generateJourneySchema = z.object({
  journeyPreferences: journeyPreferencesSchema.optional(),
  source: z.enum(["intake", "quick", "aria", "regenerate"]).optional(),
});

const revisionStartSchema = z.object({
  focusMilestoneOrder: z.number().int().positive().optional(),
  themes: z
    .array(z.enum(["timeline", "direction", "milestone", "skills", "risks", "pace", "other"]))
    .optional(),
});

const revisionBriefSchema = z.object({
  conversationId: z.string().uuid(),
});

const setupApplySchema = z.object({
  conversationId: z.string().uuid(),
  generate: z.boolean().optional(),
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
 * GET /api/v1/profile/me/journey/intake
 * Profile summary + inferred preferences for journey setup intake.
 */
export async function getJourneyIntake(req: Request, res: Response): Promise<void> {
  const data = await intakeService.getJourneyIntake(req.user!.id);
  if (data === null) throw Errors.notFound("Profile");
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

  const result = await journeyService.generateJourney(
    req.user!.id,
    parsed.data.journeyPreferences,
  );
  if (result === null) throw Errors.notFound("Profile");
  ok(res, result);
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

/**
 * POST /api/v1/profile/me/journey/revision/start
 */
export async function startRevision(req: Request, res: Response): Promise<void> {
  const parsed = revisionStartSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw Errors.badRequest("Invalid revision start request", z.flattenError(parsed.error));
  }

  const data = await reviseService.startRevision(req.user!.id, parsed.data);
  if (data === null) throw Errors.notFound("Career journey");
  ok(res, data);
}

/**
 * POST /api/v1/profile/me/journey/revision/brief
 */
export async function revisionBrief(req: Request, res: Response): Promise<void> {
  const parsed = revisionBriefSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw Errors.badRequest("Invalid revision brief request", z.flattenError(parsed.error));
  }

  const result = await reviseService.previewRevision(req.user!.id, parsed.data.conversationId);
  if (result === null) throw Errors.notFound("Revision conversation");
  ok(res, result);
}

/**
 * POST /api/v1/profile/me/journey/revise
 */
export async function reviseJourney(req: Request, res: Response): Promise<void> {
  const parsed = journeyRevisionBriefSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw Errors.badRequest("Invalid revision brief", z.flattenError(parsed.error));
  }

  const result = await reviseService.reviseJourney(
    req.user!.id,
    parsed.data as JourneyRevisionBrief,
  );
  if (result === null) throw Errors.notFound("Career journey");
  ok(res, result);
}

/**
 * POST /api/v1/profile/me/journey/setup/start
 */
export async function startSetup(req: Request, res: Response): Promise<void> {
  const data = await setupService.startSetupConversation(req.user!.id);
  if (data === null) throw Errors.notFound("Profile");
  ok(res, data);
}

/**
 * POST /api/v1/profile/me/journey/setup/apply
 */
export async function applySetup(req: Request, res: Response): Promise<void> {
  const parsed = setupApplySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    throw Errors.badRequest("Invalid setup apply request", z.flattenError(parsed.error));
  }

  const result = await setupService.applySetupFromConversation(
    req.user!.id,
    parsed.data.conversationId,
    { generate: parsed.data.generate },
  );
  if (result === null) throw Errors.notFound("Setup conversation");
  ok(res, result);
}

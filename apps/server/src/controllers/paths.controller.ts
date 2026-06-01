import type { Request, Response } from "express";

import { z } from "zod";
import { Errors } from "../errors/http-error.js";
import { ok } from "../lib/respond.js";
import * as pathsService from "../services/paths.service.js";

const milestoneStatusSchema = z.enum(["not_started", "in_progress", "completed"]).nullable();

/**
 * GET /api/v1/profile/me/paths
 */
export async function getPaths(req: Request, res: Response): Promise<void> {
  const paths = await pathsService.getPaths(req.user!.id);
  if (paths === null) throw Errors.notFound("Profile");
  ok(res, { paths });
}

/**
 * POST /api/v1/profile/me/paths/generate
 * Regenerates the user's path set (clears activation by design).
 */
export async function generatePaths(req: Request, res: Response): Promise<void> {
  const paths = await pathsService.generatePaths(req.user!.id);
  if (paths === null) throw Errors.notFound("Profile");
  ok(res, { paths });
}

/**
 * PUT /api/v1/profile/me/paths/:id/activate
 */
export async function activatePath(req: Request, res: Response): Promise<void> {
  const pathId = req.params.id as string;
  if (!pathId) throw Errors.badRequest("Path id is required");

  const paths = await pathsService.activatePath(req.user!.id, pathId);
  if (paths === null) throw Errors.notFound("Career path");
  ok(res, { paths });
}

/**
 * PATCH /api/v1/profile/me/paths/:pathId/milestones/:order
 * Body: { status: MilestoneStatus | null }  (null = reset to AI-inferred)
 */
export async function updateMilestoneStatus(req: Request, res: Response): Promise<void> {
  const pathId = req.params.pathId as string;
  const order = parseInt(req.params.order as string, 10);
  if (isNaN(order)) throw Errors.badRequest("Milestone order must be a number");

  const parsed = milestoneStatusSchema.safeParse(req.body.status ?? null);
  if (!parsed.success) throw Errors.badRequest("Invalid status value");

  const path = await pathsService.updateMilestoneStatus(req.user!.id, pathId, order, parsed.data);
  if (path === null) throw Errors.notFound("Career path");
  ok(res, { path });
}

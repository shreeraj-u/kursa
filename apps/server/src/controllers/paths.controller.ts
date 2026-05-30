import type { Request, Response } from "express";

import { Errors } from "../errors/http-error.js";
import { ok } from "../lib/respond.js";
import * as pathsService from "../services/paths.service.js";

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

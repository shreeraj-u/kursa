import type { Request, Response } from "express";
import { Errors } from "../errors/http-error.js";
import { ok } from "../lib/respond.js";
import * as dashboardService from "../services/dashboard.service.js";

/**
 * GET /api/v1/profile/me/dashboard
 */
export async function getDashboardMetrics(
  req: Request,
  res: Response,
): Promise<void> {
  const metrics = await dashboardService.getDashboardMetrics(req.user!.id);
  if (!metrics) {
    throw Errors.notFound("Profile");
  }

  ok(res, metrics);
}

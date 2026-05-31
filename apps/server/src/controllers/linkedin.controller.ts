import type { Request, Response } from "express";

import { ok } from "../lib/respond.js";
import * as linkedInService from "../services/linkedin-sync.service.js";

export async function syncLinkedIn(req: Request, res: Response): Promise<void> {
  const data = await linkedInService.syncLinkedInProfile(req.user!.id);
  ok(res, data);
}

export async function getLinkedInStatus(req: Request, res: Response): Promise<void> {
  const url = await linkedInService.getLinkedInUrl(req.user!.id);
  ok(res, { url, configured: !!url });
}

import type { Request, Response } from "express";
import { z } from "zod";

import { Errors } from "../errors/http-error.js";
import { ok } from "../lib/respond.js";
import * as checkinsService from "../services/checkins.service.js";
import { submitCheckInSchema } from "../validators/checkins.validator.js";

export async function getNext(req: Request, res: Response): Promise<void> {
  const data = await checkinsService.getNextCheckIn(req.user!.id);
  ok(res, data);
}

export async function submit(req: Request, res: Response): Promise<void> {
  const parsed = submitCheckInSchema.safeParse(req.body);
  if (!parsed.success) {
    throw Errors.badRequest("Invalid check-in payload", z.flattenError(parsed.error));
  }
  const event = await checkinsService.submitCheckIn(req.user!.id, parsed.data);
  ok(res, { event });
}

export async function history(req: Request, res: Response): Promise<void> {
  const data = await checkinsService.getCheckInHistory(req.user!.id);
  ok(res, { data });
}

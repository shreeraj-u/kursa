import type { Request, Response } from "express";
import type { ZodSchema } from "zod";
import { z } from "zod";

import { Errors } from "../errors/http-error.js";
import { ok, created } from "../lib/respond.js";
import * as applicationService from "../services/application.service.js";
import {
  applicationCreateSchema,
  applicationUpdateSchema,
} from "../validators/application.validator.js";

function parseOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) throw Errors.badRequest("Invalid request body", z.flattenError(result.error));
  return result.data;
}

export async function listApplications(req: Request, res: Response): Promise<void> {
  const applications = await applicationService.listApplications(req.user!.id);
  ok(res, { applications });
}

export async function createApplication(req: Request, res: Response): Promise<void> {
  const data = parseOrThrow(applicationCreateSchema, req.body);
  const application = await applicationService.createApplication(req.user!.id, data);
  created(res, { application });
}

export async function updateApplication(req: Request, res: Response): Promise<void> {
  const data = parseOrThrow(applicationUpdateSchema, req.body);
  const application = await applicationService.updateApplication(req.user!.id, req.params.id as string, data);
  ok(res, { application });
}

export async function deleteApplication(req: Request, res: Response): Promise<void> {
  await applicationService.deleteApplication(req.user!.id, req.params.id as string);
  ok(res, { deleted: true });
}

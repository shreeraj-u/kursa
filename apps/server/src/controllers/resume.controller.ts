import type { Request, Response } from "express";

import { Errors } from "../errors/http-error.js";
import { ok, created } from "../lib/respond.js";
import * as resumeService from "../services/resume.service.js";
import {
  GenerationInProgressError,
  InvalidResumeContentError,
  QuotaExceededError,
  RESUME_DAILY_LIMIT,
} from "../services/resume.service.js";

/**
 * GET /api/v1/profile/me/resumes
 */
export async function listResumes(req: Request, res: Response): Promise<void> {
  const result = await resumeService.listResumes(req.user!.id);
  if (result === null) throw Errors.notFound("Profile");
  ok(res, result);
}

/**
 * POST /api/v1/profile/me/resumes/generate
 */
export async function generateResume(req: Request, res: Response): Promise<void> {
  try {
    const resume = await resumeService.generateResume(req.user!.id);
    if (resume === null) throw Errors.notFound("Profile");
    created(res, { resume });
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      throw Errors.tooManyRequests(
        `You've reached today's limit of ${RESUME_DAILY_LIMIT} resume generations.`,
        { used: err.used, limit: err.limit },
      );
    }
    if (err instanceof GenerationInProgressError) {
      throw Errors.conflict("A resume is already being generated. Please wait.");
    }
    throw err;
  }
}

/**
 * PUT /api/v1/profile/me/resumes/:id
 * Persists user edits to the resume content in place.
 */
export async function updateResume(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  if (!id) throw Errors.badRequest("Resume id is required");

  const content = (req.body as { content?: unknown })?.content;
  if (content === undefined) throw Errors.badRequest("content is required");

  try {
    const resume = await resumeService.updateResume(req.user!.id, id, content);
    if (resume === null) throw Errors.notFound("Resume");
    ok(res, { resume });
  } catch (err) {
    if (err instanceof InvalidResumeContentError) {
      throw Errors.badRequest("Invalid resume content", err.details);
    }
    throw err;
  }
}

/**
 * POST /api/v1/profile/me/resumes/:id/analyze
 * Re-scores the resume's current content against ATS criteria (quota-free).
 */
export async function analyzeResume(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  if (!id) throw Errors.badRequest("Resume id is required");

  try {
    const resume = await resumeService.analyzeResume(req.user!.id, id);
    if (resume === null) throw Errors.notFound("Resume");
    ok(res, { resume });
  } catch (err) {
    if (err instanceof GenerationInProgressError) {
      throw Errors.conflict("This resume is already being analyzed. Please wait.");
    }
    throw err;
  }
}

/**
 * GET /api/v1/profile/me/resumes/:id
 */
export async function getResume(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  if (!id) throw Errors.badRequest("Resume id is required");

  const resume = await resumeService.getResume(req.user!.id, id);
  if (resume === null) throw Errors.notFound("Resume");
  ok(res, { resume });
}

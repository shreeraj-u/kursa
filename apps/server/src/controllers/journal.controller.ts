import type { Request, Response } from "express";
import { z } from "zod";

import { Errors } from "../errors/http-error.js";
import { ok } from "../lib/respond.js";
import * as journalService from "../services/journal.service.js";
import * as reviewPrepService from "../services/review-prep.service.js";
import { getMemoriesForUser } from "../services/memory.service.js";
import {
  createNoteSchema,
  createWinSchema,
  reviewPrepQuerySchema,
  timelineQuerySchema,
} from "../validators/journal.validator.js";

export async function getTimeline(req: Request, res: Response): Promise<void> {
  const parsed = timelineQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw Errors.badRequest("Invalid query", z.flattenError(parsed.error));
  }
  const { page, limit, filter } = parsed.data;
  const data = await journalService.getTimeline(
    req.user!.id,
    page,
    limit,
    filter === "win" ? "win" : "all",
  );
  ok(res, data);
}

export async function createWin(req: Request, res: Response): Promise<void> {
  const parsed = createWinSchema.safeParse(req.body);
  if (!parsed.success) {
    throw Errors.badRequest("Invalid win payload", z.flattenError(parsed.error));
  }
  const event = await journalService.createWin(req.user!.id, parsed.data);
  ok(res, { event });
}

export async function createNote(req: Request, res: Response): Promise<void> {
  const parsed = createNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    throw Errors.badRequest("Invalid note payload", z.flattenError(parsed.error));
  }
  const event = await journalService.createNote(req.user!.id, parsed.data);
  ok(res, { event });
}

export async function getContext(req: Request, res: Response): Promise<void> {
  const data = await journalService.getJournalContext(req.user!.id);
  ok(res, data);
}

export async function getTrend(req: Request, res: Response): Promise<void> {
  const data = await journalService.getSentimentTrend(req.user!.id);
  ok(res, { data });
}

export async function getRelevance(req: Request, res: Response): Promise<void> {
  const data = await journalService.getRelevance(req.user!.id);
  ok(res, data);
}

export async function getReviewPrep(req: Request, res: Response): Promise<void> {
  const parsed = reviewPrepQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw Errors.badRequest("Invalid query", z.flattenError(parsed.error));
  }
  const to = parsed.data.to ? new Date(parsed.data.to) : new Date();
  const from = parsed.data.from
    ? new Date(parsed.data.from)
    : new Date(to.getTime() - 86400000 * 90);
  const data = await reviewPrepService.generateReviewPrep(req.user!.id, from, to);
  ok(res, data);
}

export async function getMemories(req: Request, res: Response): Promise<void> {
  const data = await getMemoriesForUser(req.user!.id);
  ok(res, { data });
}

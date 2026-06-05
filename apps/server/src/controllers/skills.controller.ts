import type { Request, Response } from "express";
import { z } from "zod";

import { Errors } from "../errors/http-error.js";
import { ok, created } from "../lib/respond.js";
import * as skillsIntelligence from "../services/skills-intelligence.service.js";
import * as skillsService from "../services/skills.service.js";
import {
  skillCreateSchema,
  skillInterpretSchema,
  skillProposalQuerySchema,
  skillUpdateSchema,
} from "../validators/skills.validator.js";

export async function getSkillsOverview(req: Request, res: Response): Promise<void> {
  const data = await skillsIntelligence.getSkillsOverview(req.user!.id);
  if (!data) throw Errors.notFound("Profile");
  ok(res, data);
}

export async function createSkill(req: Request, res: Response): Promise<void> {
  const parsed = skillCreateSchema.safeParse(req.body);
  if (!parsed.success) throw Errors.badRequest("Invalid skill", z.flattenError(parsed.error));
  const skill = await skillsService.createSkill(req.user!.id, parsed.data);
  created(res, { skill });
}

export async function updateSkill(req: Request, res: Response): Promise<void> {
  const parsed = skillUpdateSchema.safeParse(req.body);
  if (!parsed.success) throw Errors.badRequest("Invalid skill", z.flattenError(parsed.error));
  const id = req.params.id;
  if (typeof id !== "string" || !id) throw Errors.badRequest("Skill id required");
  const skill = await skillsService.updateSkill(req.user!.id, id, parsed.data);
  ok(res, { skill });
}

export async function deleteSkill(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  if (typeof id !== "string" || !id) throw Errors.badRequest("Skill id required");
  await skillsService.deleteSkill(req.user!.id, id);
  ok(res, { deleted: true });
}

export async function listSkillProposals(req: Request, res: Response): Promise<void> {
  const parsed = skillProposalQuerySchema.safeParse(req.query);
  if (!parsed.success) throw Errors.badRequest("Invalid query", z.flattenError(parsed.error));
  const data = await skillsService.listSkillProposals(
    req.user!.id,
    parsed.data.status,
    parsed.data.limit,
  );
  ok(res, data);
}

export async function acceptSkillProposal(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  if (typeof id !== "string" || !id) throw Errors.badRequest("Proposal id required");
  const skill = await skillsService.acceptSkillProposal(req.user!.id, id);
  ok(res, { skill, accepted: true });
}

export async function dismissSkillProposal(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  if (typeof id !== "string" || !id) throw Errors.badRequest("Proposal id required");
  await skillsService.dismissSkillProposal(req.user!.id, id);
  ok(res, { dismissed: true });
}

export async function interpretSkillMessage(req: Request, res: Response): Promise<void> {
  const parsed = skillInterpretSchema.safeParse(req.body);
  if (!parsed.success) throw Errors.badRequest("Invalid", z.flattenError(parsed.error));
  const result = await skillsIntelligence.interpretSkillMessage(req.user!.id, parsed.data.message);
  ok(res, result);
}

import type { Request, Response } from "express";

import { ok } from "../lib/respond.js";
import * as projectProposalService from "../services/project-proposal.service.js";

export async function listProjectProposals(req: Request, res: Response): Promise<void> {
  const status = (req.query.status as "pending" | "accepted" | "dismissed") ?? "pending";
  const result = await projectProposalService.listProjectProposals(req.user!.id, status);
  ok(res, result);
}

export async function acceptProjectProposal(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const project = await projectProposalService.acceptProjectProposal(req.user!.id, id);
  ok(res, { project });
}

export async function dismissProjectProposal(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  await projectProposalService.dismissProjectProposal(req.user!.id, id);
  ok(res, { ok: true });
}

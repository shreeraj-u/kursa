import type { Request, Response } from "express";

import { ok } from "../lib/respond.js";
import { githubSyncConfirmSchema } from "../validators/github.validator.js";
import * as githubService from "../services/github-sync.service.js";

export async function getRepos(req: Request, res: Response): Promise<void> {
  const token = await githubService.getGitHubToken(req.user!.id);
  if (!token) {
    res.status(200).json({ connected: false, repos: [] });
    return;
  }

  const repos = await githubService.fetchUserRepos(token);
  const preview = await githubService.buildPreview(req.user!.id, repos);
  ok(res, preview);
}

export async function syncRepos(req: Request, res: Response): Promise<void> {
  const body = githubSyncConfirmSchema.parse(req.body);

  const token = await githubService.getGitHubToken(req.user!.id);
  if (!token) {
    res.status(400).json({ error: "GitHub account not connected" });
    return;
  }

  const repos = await githubService.fetchUserRepos(token);
  const result = await githubService.persistSync(req.user!.id, token, body, repos);
  ok(res, result);
}

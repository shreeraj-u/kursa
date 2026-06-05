import type { Request, Response } from "express";

import { ok } from "../lib/respond.js";
import { githubSyncConfirmSchema } from "../validators/github.validator.js";
import * as githubService from "../services/github-sync.service.js";

const ingestLastRun = new Map<string, number>();
const INGEST_COOLDOWN_MS = 3600000;

export async function getStatus(req: Request, res: Response): Promise<void> {
  const status = await githubService.getGitHubStatus(req.user!.id);
  ok(res, status);
}

export async function getSnapshot(req: Request, res: Response): Promise<void> {
  const snapshot = await githubService.getGitHubSnapshot(req.user!.id);
  ok(res, { snapshot });
}

export async function ingestProfile(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const last = ingestLastRun.get(userId) ?? 0;
  if (Date.now() - last < INGEST_COOLDOWN_MS) {
    res.status(429).json({ error: "GitHub ingest rate limit — try again in an hour" });
    return;
  }
  ingestLastRun.set(userId, Date.now());
  githubService.scheduleGitHubIngest(userId);
  ok(res, { scheduled: true });
}

export async function getRepos(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const token = await githubService.getGitHubToken(userId);
  if (!token) {
    ok(res, { connected: false, repos: [] });
    return;
  }

  const status = await githubService.getGitHubStatus(userId);
  if (status.snapshotStatus === "none" || status.snapshotStatus === "failed") {
    githubService.scheduleGitHubIngest(userId);
  }

  const repos = await githubService.fetchUserRepos(token);
  const preview = await githubService.buildPreview(userId, repos);
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

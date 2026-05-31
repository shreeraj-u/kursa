import type { Request, Response } from "express";

import { getMarketContextForUser } from "../services/market.service.js";

export async function getContext(req: Request, res: Response): Promise<void> {
  const data = await getMarketContextForUser(req.user!.id);
  res.json({ data });
}

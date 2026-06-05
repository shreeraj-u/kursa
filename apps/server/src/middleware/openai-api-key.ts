import type { NextFunction, Request, Response } from "express";

import { runWithOpenAIApiKey } from "../lib/openai.js";

export const OPENAI_API_KEY_HEADER = "x-openai-api-key";

export function openAIApiKey(req: Request, _res: Response, next: NextFunction): void {
  const rawHeader = req.header(OPENAI_API_KEY_HEADER);
  const apiKey = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  runWithOpenAIApiKey(apiKey, next);
}

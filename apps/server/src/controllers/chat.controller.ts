import type { Request, Response } from "express";
import { z } from "zod";

import { Errors } from "../errors/http-error.js";
import { ok } from "../lib/respond.js";
import * as chatService from "../services/chat.service.js";
import {
  createConversationSchema,
  recordDecisionSchema,
  sendMessageSchema,
} from "../validators/chat.validator.js";

export async function listConversations(req: Request, res: Response): Promise<void> {
  const data = await chatService.listConversations(req.user!.id);
  ok(res, { conversations: data });
}

export async function createConversation(req: Request, res: Response): Promise<void> {
  const parsed = createConversationSchema.safeParse(req.body);
  if (!parsed.success) {
    throw Errors.badRequest("Invalid payload", z.flattenError(parsed.error));
  }
  const data = await chatService.createConversation(req.user!.id, parsed.data.decisionType);
  ok(res, data);
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    throw Errors.badRequest("Invalid message", z.flattenError(parsed.error));
  }
  const conversationId = String(req.params.id);
  if (!conversationId) throw Errors.badRequest("Conversation id required");
  const data = await chatService.sendChatMessage(req.user!.id, conversationId, parsed.data.content);
  ok(res, data);
}

export async function recordDecision(req: Request, res: Response): Promise<void> {
  const parsed = recordDecisionSchema.safeParse(req.body);
  if (!parsed.success) {
    throw Errors.badRequest("Invalid decision", z.flattenError(parsed.error));
  }
  const conversationId = String(req.params.id);
  if (!conversationId) throw Errors.badRequest("Conversation id required");
  await chatService.recordDecisionFromChat(req.user!.id, {
    conversationId,
    ...parsed.data,
  });
  ok(res, { recorded: true });
}

export async function getMeta(req: Request, res: Response): Promise<void> {
  const data = await chatService.getChatMeta(req.user!.id);
  ok(res, data);
}

export async function getSuggestedPrompts(req: Request, res: Response): Promise<void> {
  const prompts = await chatService.getSuggestedPrompts(req.user!.id);
  ok(res, { prompts });
}

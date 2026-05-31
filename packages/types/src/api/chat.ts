import type { ChatDecisionType } from "./intelligence.js";

export type ChatActionType =
  | "log_decision"
  | "open_journal"
  | "regen_paths"
  | "prefill"
  | "open_career_path";

export interface ChatActionChip {
  id: string;
  label: string;
  action: ChatActionType;
  href?: string;
  prefill?: string;
}

export interface ChatSendResponse {
  message: string;
  conversationId: string;
  suggestedPrompts: string[];
  suggestedActions: ChatActionChip[];
  /** Facts persisted to long-term memory from this message (0 if none). */
  memoriesLearned?: number;
}

export interface ChatMetaResponse {
  memoryFactCount: number;
  contextDays: number;
  mainConversationId: string | null;
  marketAvailable: boolean;
  marketAsOf: string | null;
  marketSources?: string[];
  syncedAt: string;
}

export interface ChatSuggestedPromptsResponse {
  prompts: string[];
}

export interface ConversationListItem {
  id: string;
  decisionType: ChatDecisionType | null;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
  }>;
}

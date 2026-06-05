import { AsyncLocalStorage } from "node:async_hooks";

import { env } from "@kursa/env/server";
import OpenAI from "openai";

const requestApiKey = new AsyncLocalStorage<string | null>();
export class MissingOpenAIKeyError extends Error {
  constructor() {
    super("Add your OpenAI API key in Kursa to use AI features.");
    this.name = "MissingOpenAIKeyError";
  }
}

export function runWithOpenAIApiKey<T>(apiKey: string | undefined, callback: () => T): T {
  return requestApiKey.run(apiKey?.trim() || null, callback);
}

export function getCurrentOpenAIApiKey(): string | undefined {
  const scopedKey = requestApiKey.getStore();
  if (scopedKey !== undefined) return scopedKey ?? undefined;
  return env.OPENAI_API_KEY;
}

export function getOpenAIClient(): OpenAI {
  const apiKey = getCurrentOpenAIApiKey();
  if (!apiKey) {
    throw new MissingOpenAIKeyError();
  }

  return new OpenAI({ apiKey });
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    const client = getOpenAIClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

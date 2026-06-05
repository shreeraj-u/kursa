export const OPENAI_API_KEY_STORAGE_KEY = "kursa.openaiApiKey";
export const OPENAI_API_KEY_HEADER = "x-openai-api-key";

export function getStoredOpenAIApiKey(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(OPENAI_API_KEY_STORAGE_KEY) ?? "";
}

export function setStoredOpenAIApiKey(apiKey: string): void {
  if (typeof window === "undefined") return;
  const trimmed = apiKey.trim();
  if (trimmed) {
    window.localStorage.setItem(OPENAI_API_KEY_STORAGE_KEY, trimmed);
  } else {
    window.localStorage.removeItem(OPENAI_API_KEY_STORAGE_KEY);
  }
  window.dispatchEvent(new CustomEvent("kursa-openai-key-change"));
}

export function getOpenAIKeyHeader(): Record<string, string> {
  const apiKey = getStoredOpenAIApiKey();
  return apiKey ? { [OPENAI_API_KEY_HEADER]: apiKey } : {};
}

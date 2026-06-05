"use client";

import { useEffect, useState } from "react";
import { KeyRound, X } from "lucide-react";
import { toast } from "sonner";

import { getStoredOpenAIApiKey, setStoredOpenAIApiKey } from "@/lib/openai-key";

function maskKey(apiKey: string): string {
  if (!apiKey) return "not set";
  if (apiKey.length <= 10) return "saved";
  return `${apiKey.slice(0, 7)}…${apiKey.slice(-4)}`;
}

export default function OpenAIKeyControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [savedKey, setSavedKey] = useState("");
  const [draftKey, setDraftKey] = useState("");

  useEffect(() => {
    const refresh = () => {
      const key = getStoredOpenAIApiKey();
      setSavedKey(key);
      setDraftKey(key);
    };
    refresh();
    window.addEventListener("kursa-openai-key-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("kursa-openai-key-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  function handleSave() {
    setStoredOpenAIApiKey(draftKey);
    setSavedKey(draftKey.trim());
    setIsOpen(false);
    toast.success(draftKey.trim() ? "OpenAI key saved locally" : "OpenAI key removed");
  }

  function handleClear() {
    setDraftKey("");
    setStoredOpenAIApiKey("");
    setSavedKey("");
    toast.success("OpenAI key removed");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="mono flex items-center gap-1.5 rounded-md border px-2.5 py-1 transition-colors hover:bg-bg-sub"
        style={{
          fontSize: "var(--text-xs)",
          color: savedKey ? "var(--ink)" : "var(--accent)",
          borderColor: savedKey ? "var(--line-2)" : "var(--accent-line)",
          background: savedKey ? "var(--bg)" : "var(--accent-soft)",
        }}
        title="Use your own OpenAI key for demo AI features"
      >
        <KeyRound size={11} />
        OpenAI · {savedKey ? "ready" : "add key"}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-8 z-30 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-3 shadow-xl">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <p className="mono text-[9px] uppercase tracking-[0.18em] text-accent">demo key</p>
              <h2 className="mt-1 text-sm font-semibold text-ink">Use your OpenAI key</h2>
              <p className="mt-1 text-xs leading-relaxed text-mute">
                Kursa sends this key only with your browser requests. It is stored in this browser, not in our database.
              </p>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="text-mute hover:text-ink" aria-label="Close OpenAI key settings">
              <X size={14} />
            </button>
          </div>

          <label className="mono mb-1 block text-[9px] uppercase tracking-[0.16em] text-mute">OpenAI API key</label>
          <input
            value={draftKey}
            onChange={(event) => setDraftKey(event.target.value)}
            type="password"
            placeholder="sk-…"
            autoComplete="off"
            className="w-full rounded-md border border-line bg-bg px-2 py-2 text-xs text-ink outline-none transition-colors placeholder:text-mute-3 focus:border-accent-line"
          />
          <p className="mt-1 text-[11px] text-mute">Current: {maskKey(savedKey)}</p>

          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={handleClear} className="mono rounded-md border border-line bg-bg px-2.5 py-1 text-[10px] text-mute hover:text-ink">
              clear
            </button>
            <button type="button" onClick={handleSave} className="mono rounded-md bg-accent px-2.5 py-1 text-[10px] text-white">
              save locally
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

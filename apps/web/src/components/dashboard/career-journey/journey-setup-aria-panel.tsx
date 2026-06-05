"use client";

import { useCallback, useEffect, useState } from "react";
import type { CareerJourney, JourneyIntakeSummary, JourneyPreferences } from "@kursa/types";
import { Button } from "@kursa/ui/components/button";
import { api } from "@/lib/api";

import JourneyProfileReflect from "./journey-profile-reflect";

interface JourneySetupAriaPanelProps {
  onClose: () => void;
  onApplied: (
    result: {
      preferences: JourneyPreferences;
      journey?: CareerJourney;
      welcomeSummary?: string;
    },
    options: { generate: boolean },
  ) => void;
  /** When true, apply will regenerate the journey from chat preferences. */
  generateOnApply?: boolean;
}

export default function JourneySetupAriaPanel({
  onClose,
  onApplied,
  generateOnApply = true,
}: JourneySetupAriaPanelProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [intakeSummary, setIntakeSummary] = useState<JourneyIntakeSummary | null>(null);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [starterChips, setStarterChips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api.journey
      .setupStart()
      .then(async (data) => {
        if (cancelled) return;
        setConversationId(data.conversationId);
        setIntakeSummary(data.intakeSummary);
        setStarterChips(data.starterChips);

        const list = await api.chat.list();
        const thread = list.conversations.find((c) => c.id === data.conversationId);
        if (thread && thread.messages.length > 0) {
          setMessages(
            thread.messages.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          );
        } else {
          setMessages([{ role: "assistant", content: data.initialMessage }]);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to open Aria");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !content.trim()) return;
      setSending(true);
      setError(null);
      setMessages((prev) => [...prev, { role: "user", content }]);
      setInput("");
      try {
        const res = await api.chat.send(conversationId, content);
        setMessages((prev) => [...prev, { role: "assistant", content: res.message }]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send message");
      } finally {
        setSending(false);
      }
    },
    [conversationId],
  );

  async function applyFromChat(generate: boolean) {
    if (!conversationId) return;
    setApplying(true);
    setError(null);
    try {
      const result = await api.journey.setupApply(conversationId, generate);
      onApplied(
        {
          preferences: result.preferences,
          journey: result.journey,
          welcomeSummary: result.welcomeSummary,
        },
        { generate },
      );
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not apply changes from chat");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        className="flex h-[min(640px,90vh)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-bg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <div className="mono text-2xs uppercase tracking-mono text-mute-2">Talk with Aria</div>
            <div className="text-sm font-medium text-ink">Shape your career journey</div>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[1fr_260px]">
          <div className="flex min-h-0 flex-col border-b border-line lg:border-b-0 lg:border-r">
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {loading && <div className="mono text-2xs text-mute-2">Opening Aria…</div>}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user" ? "ml-6 bg-accent text-white" : "mr-6 bg-bg-sub text-ink"
                  }`}
                >
                  {m.content}
                </div>
              ))}
            </div>

            <div className="border-t border-line p-4">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {starterChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => void sendMessage(chip)}
                    disabled={sending || loading}
                    className="mono rounded-full border border-line bg-bg-sub-2 px-2 py-0.5 text-2xs text-mute hover:border-accent disabled:opacity-50"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendMessage(input);
                }}
                className="flex gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tell Aria what you want from this path…"
                  className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm"
                  disabled={sending || loading}
                />
                <Button type="submit" size="sm" disabled={sending || loading || !input.trim()}>
                  Send
                </Button>
              </form>
            </div>
          </div>

          <div className="overflow-y-auto p-4">
            {intakeSummary && <JourneyProfileReflect summary={intakeSummary} />}
            <p className="mt-4 text-xs leading-relaxed text-mute-2">
              When you&apos;re done talking, Aria will turn the conversation into journey preferences
              {generateOnApply ? " and generate your path" : ""}.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {generateOnApply && (
                <Button
                  size="sm"
                  disabled={applying || !conversationId || messages.length < 2}
                  onClick={() => void applyFromChat(true)}
                >
                  {applying ? "Applying…" : "Apply & generate journey"}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                disabled={applying || !conversationId || messages.length < 2}
                onClick={() => void applyFromChat(false)}
              >
                Update preferences only
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="border-t border-line px-5 py-2 mono text-2xs text-warn">{error}</div>
        )}
      </div>
    </div>
  );
}

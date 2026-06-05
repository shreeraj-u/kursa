"use client";

import { useCallback, useEffect, useState } from "react";
import type { CareerJourney, JourneyRevisionBrief, JourneyRevisionPreview } from "@kursa/types";
import { Button } from "@kursa/ui/components/button";
import { api } from "@/lib/api";

import JourneyRevisionPreviewCard from "./journey-revision-preview";

interface JourneyChangePathPanelProps {
  journey: CareerJourney;
  focusMilestoneOrder?: number;
  onClose: () => void;
  onApplied: (journey: CareerJourney) => void;
}

export default function JourneyChangePathPanel({
  journey,
  focusMilestoneOrder,
  onClose,
  onApplied,
}: JourneyChangePathPanelProps) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [starterChips, setStarterChips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [briefing, setBriefing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [brief, setBrief] = useState<JourneyRevisionBrief | null>(null);
  const [preview, setPreview] = useState<JourneyRevisionPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api.journey
      .revisionStart(
        focusMilestoneOrder != null ? { focusMilestoneOrder, themes: ["milestone"] } : undefined,
      )
      .then((data) => {
        if (cancelled) return;
        setConversationId(data.conversationId);
        setStarterChips(data.starterChips);
        setMessages([{ role: "assistant", content: data.initialMessage }]);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to start revision");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [focusMilestoneOrder]);

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

  async function loadPreview() {
    if (!conversationId) return;
    setBriefing(true);
    setError(null);
    try {
      const result = await api.journey.revisionBrief(conversationId);
      setBrief(result.brief);
      setPreview(result.preview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not draft changes yet");
    } finally {
      setBriefing(false);
    }
  }

  async function applyRevision() {
    if (!brief) return;
    setApplying(true);
    try {
      const result = await api.journey.revise(brief);
      onApplied(result.journey);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to apply revision");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div
        className="flex h-full w-full max-w-4xl flex-col border-l border-line bg-bg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <div className="mono text-2xs uppercase tracking-mono text-mute-2">Change the path</div>
            <div className="text-sm font-medium text-ink">{journey.title}</div>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-2">
          <div className="flex flex-col border-b border-line lg:border-b-0 lg:border-r">
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {loading && <div className="mono text-2xs text-mute-2">Starting Aria…</div>}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    m.role === "user" ? "ml-8 bg-accent text-white" : "mr-8 bg-bg-sub text-ink"
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
                    className="mono rounded-full border border-line bg-bg-sub-2 px-2 py-0.5 text-2xs text-mute hover:border-accent"
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
                  placeholder="Tell Aria what feels off…"
                  className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm"
                  disabled={sending || loading}
                />
                <Button type="submit" size="sm" disabled={sending || loading}>
                  Send
                </Button>
              </form>
              <Button
                className="mt-2"
                variant="outline"
                size="sm"
                onClick={() => void loadPreview()}
                disabled={briefing || !conversationId}
              >
                {briefing ? "Drafting…" : "Review drafted changes"}
              </Button>
            </div>
          </div>

          <div className="overflow-y-auto p-4">
            <div className="mono mb-3 text-2xs uppercase tracking-mono text-mute-2">Current path</div>
            <p className="text-sm text-mute-2">{journey.details?.strategySummary || journey.description}</p>
            <ol className="mt-4 space-y-2">
              {journey.milestones.map((m) => (
                <li
                  key={m.order}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    m.order === focusMilestoneOrder ? "border-accent bg-accent-soft" : "border-line"
                  }`}
                >
                  <span className="mono text-2xs text-mute-3">#{m.order}</span> {m.title}
                </li>
              ))}
            </ol>

            {brief && preview && (
              <div className="mt-4">
                <JourneyRevisionPreviewCard
                  preview={preview}
                  onApply={() => void applyRevision()}
                  onKeepRefining={() => {
                    setBrief(null);
                    setPreview(null);
                  }}
                  onCancel={onClose}
                  applying={applying}
                />
              </div>
            )}
          </div>
        </div>

        {error && <div className="border-t border-line px-5 py-2 mono text-2xs text-warn">{error}</div>}
      </div>
    </div>
  );
}

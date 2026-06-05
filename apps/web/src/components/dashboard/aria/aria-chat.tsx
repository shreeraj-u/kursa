"use client";

import { AnimatePresence } from "motion/react";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import PageHeader from "@/components/dashboard/page-header";
import { TypingIndicator } from "@/components/onboarding/typing-indicator";
import { api } from "@/lib/api";
import type {
  ChatActionChip,
  ChatDecisionType,
  ChatMetaResponse,
  ChatSkillProposalHint,
  ConversationListItem,
} from "@kursa/types";

import { AriaMessageBubble } from "./aria-message-bubble";
import { DECISION_TYPES, formatRelativeTime, groupThreads, isMainThread } from "./aria-utils";

export default function AriaChat() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefill = searchParams.get("prompt") ?? "";
  const threadParam = searchParams.get("thread");
  const newDecision = searchParams.get("new");

  const [meta, setMeta] = useState<ChatMetaResponse | null>(null);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState(prefill);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [suggestedActions, setSuggestedActions] = useState<ChatActionChip[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showNewDecision, setShowNewDecision] = useState(false);
  const [lastSkillProposals, setLastSkillProposals] = useState<ChatSkillProposalHint[]>([]);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const groups = groupThreads(conversations.filter((c) => !isMainThread(c)));

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const listRes = await api.chat.list();
      setConversations(listRes.conversations);

      const main = listRes.conversations.find(isMainThread);
      let nextId = threadParam ?? main?.id ?? listRes.conversations[0]?.id ?? null;

      if (newDecision && !threadParam) {
        setShowNewDecision(true);
        nextId = main?.id ?? nextId;
      }

      setActiveId(nextId);

      const [metaRes, promptsRes] = await Promise.all([
        api.chat.meta().catch(() => null),
        api.chat.suggestedPrompts().catch(() => ({ prompts: [] as string[] })),
      ]);
      if (metaRes) setMeta(metaRes);
      setSuggestedPrompts(promptsRes.prompts);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load Aria";
      setLoadError(msg);
      toast.error("Could not load Aria");
    } finally {
      setLoading(false);
    }
  }, [threadParam, newDecision]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (prefill) setInput(prefill);
  }, [prefill]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length, sending]);

  async function selectThread(id: string) {
    setActiveId(id);
    setSuggestedActions([]);
    router.replace(`/dashboard/aria?thread=${id}` as Route);
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || !activeId || sending) return;

    setSending(true);
    setInput("");
    setSuggestedActions([]);

    const optimisticUser = {
      id: `opt-${Date.now()}`,
      role: "user" as const,
      content,
      createdAt: new Date().toISOString(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId ? { ...c, messages: [...c.messages, optimisticUser], updatedAt: optimisticUser.createdAt } : c,
      ),
    );

    const memoryCountBefore = meta?.memoryFactCount ?? 0;

    try {
      const res = await api.chat.send(activeId, content);
      setSuggestedPrompts(res.suggestedPrompts);
      setSuggestedActions(res.suggestedActions);
      const listRes = await api.chat.list();
      setConversations(listRes.conversations);
      setActiveId(res.conversationId);

      if (res.skillProposals && res.skillProposals.length > 0) {
        setLastSkillProposals(res.skillProposals);
        toast.success(
          res.skillProposals.length === 1
            ? "Aria noticed a skill — review on Skills"
            : `Aria noticed ${res.skillProposals.length} skills — review on Skills`,
        );
        const metaRes = await api.chat.meta().catch(() => null);
        if (metaRes) setMeta(metaRes);
      } else {
        setLastSkillProposals([]);
      }

      if (typeof res.memoriesLearned === "number" && res.memoriesLearned > 0) {
        toast.success(
          res.memoriesLearned === 1
            ? "Aria noted 1 thing for next time"
            : `Aria noted ${res.memoriesLearned} things for next time`,
        );
        const metaRes = await api.chat.meta().catch(() => null);
        if (metaRes) setMeta(metaRes);
      } else if (!res.skillProposals?.length) {
        window.setTimeout(() => {
          void api.chat.meta().then((metaRes) => {
            setMeta(metaRes);
            if (metaRes.memoryFactCount > memoryCountBefore) {
              const delta = metaRes.memoryFactCount - memoryCountBefore;
              toast.success(
                delta === 1
                  ? "Aria noted 1 thing for next time"
                  : `Aria noted ${delta} things for next time`,
              );
            }
          });
        }, 2800);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Send failed";
      toast.error(msg.includes("fetch") ? "Aria couldn't reach the server" : msg);
      await load();
    } finally {
      setSending(false);
    }
  }

  function handleAction(action: ChatActionChip) {
    if (action.action === "prefill" && action.prefill) {
      setInput(action.prefill);
      inputRef.current?.focus();
      return;
    }
    if (action.action === "log_decision" && active) {
      startTransition(async () => {
        try {
          const lastUser = [...active.messages].reverse().find((m) => m.role === "user");
          const lastAssistant = [...active.messages].reverse().find((m) => m.role === "assistant");
          await api.chat.recordDecision(active.id, {
            title: active.title,
            optionsConsidered: [],
            choiceMade: lastUser?.content.slice(0, 200) ?? "See thread",
            reasoning: lastAssistant?.content.slice(0, 500) ?? "",
          });
          toast.success("Decision logged to journal");
        } catch {
          toast.error("Could not log decision");
        }
      });
      return;
    }
    if (action.href) {
      router.push(action.href as Route);
    }
  }

  async function createDecisionThread(type: ChatDecisionType) {
    try {
      const { id } = await api.chat.create(type);
      await load();
      setShowNewDecision(false);
      await selectThread(id);
    } catch {
      toast.error("Could not create thread");
    }
  }

  async function deleteThread(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.chat.delete(id);
      toast.success("Thread deleted");
      const listRes = await api.chat.list();
      setConversations(listRes.conversations);
      const main = listRes.conversations.find(isMainThread);
      const nextId = main?.id ?? listRes.conversations[0]?.id ?? null;
      setActiveId(nextId);
      if (nextId) {
        router.replace(`/dashboard/aria?thread=${nextId}` as Route);
      } else {
        router.replace("/dashboard/aria" as Route);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete thread");
    }
  }

  const contextLabel = meta
    ? `${meta.contextDays} days of context · pick up where you left off`
    : "Building your career context…";

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader pageTitle="Aria" breadcrumb="Workspace" />

      <div className="px-8 pt-5 pb-4 flex flex-col gap-4 flex-1 min-h-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Aria</h1>
            <p className="mono text-2xs text-mute-2 mt-1">{contextLabel}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {meta && (
              <span
                className="mono rounded-full px-2.5 py-1 text-2xs border"
                style={{ borderColor: "var(--line)", color: "var(--mute)" }}
              >
                memory · on · {meta.memoryFactCount.toLocaleString()} facts
                {meta.marketAvailable && meta.marketAsOf && (
                  <span style={{ color: "var(--accent)" }}>
                    {" "}
                    · market {formatRelativeTime(meta.marketAsOf)}
                    {meta.marketSources?.length
                      ? ` (${meta.marketSources.slice(0, 3).join(", ")})`
                      : ""}
                  </span>
                )}
                {(meta.pendingSkillProposals ?? 0) > 0 && (
                  <span style={{ color: "var(--accent)" }}>
                    {" "}
                    · {meta.pendingSkillProposals} skill{meta.pendingSkillProposals === 1 ? "" : "s"} pending
                  </span>
                )}
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowNewDecision((v) => !v)}
              className="mono rounded-md px-3 py-1.5 text-2xs border transition-colors hover:bg-bg-sub"
              style={{ borderColor: "var(--line-2)", color: "var(--ink)" }}
            >
              + new thread
            </button>
          </div>
        </div>

        {showNewDecision && (
          <div
            className="rounded-lg border p-3 flex flex-wrap gap-2"
            style={{ borderColor: "var(--line)", background: "var(--bg-sub)" }}
          >
            {DECISION_TYPES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => createDecisionThread(d.value)}
                className="mono text-2xs px-2.5 py-1 rounded border hover:bg-bg"
                style={{ borderColor: "var(--line)" }}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}

        <div
          className="grid flex-1 min-h-0 gap-0 rounded-lg border overflow-hidden"
          style={{ borderColor: "var(--line)", gridTemplateColumns: "240px 1fr", minHeight: 480 }}
        >
          <aside
            className="flex flex-col border-r overflow-y-auto"
            style={{ borderColor: "var(--line)", background: "var(--bg-sub)" }}
          >
            {conversations.filter(isMainThread).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectThread(c.id)}
                className="text-left px-3 py-2.5 border-b mono text-2xs transition-colors"
                style={{
                  borderColor: "var(--line)",
                  background: activeId === c.id ? "var(--bg)" : "transparent",
                  color: activeId === c.id ? "var(--ink)" : "var(--mute)",
                }}
              >
                <div className="font-medium">Main thread</div>
                <div style={{ color: "var(--mute-3)" }}>{formatRelativeTime(c.updatedAt)}</div>
              </button>
            ))}

            {(["this week", "this month", "older"] as const).map((label) => {
              const items = groups[label];
              if (items.length === 0) return null;
              return (
                <div key={label}>
                  <div className="mono px-3 py-2 text-2xs uppercase tracking-wide" style={{ color: "var(--mute-3)" }}>
                    {label}
                  </div>
                  {items.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-stretch border-b"
                      style={{
                        borderColor: "var(--line)",
                        background: activeId === c.id ? "var(--bg)" : "transparent",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => selectThread(c.id)}
                        className="flex-1 min-w-0 text-left px-3 py-2 transition-colors"
                      >
                        <div className="text-xs text-ink truncate">{c.title}</div>
                        <div className="mono text-2xs mt-0.5" style={{ color: "var(--mute-3)" }}>
                          {formatRelativeTime(c.updatedAt)}
                          {c.messageCount > 0 && ` · ${c.messageCount} msgs`}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteThread(c.id, c.title)}
                        className="px-2 shrink-0 transition-colors hover:text-warn"
                        style={{ color: "var(--mute-3)", background: "transparent", border: "none", cursor: "pointer" }}
                        title="Delete thread"
                        aria-label={`Delete ${c.title}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </aside>

          <div className="flex flex-col min-h-0 bg-bg">
            {loadError && !loading && conversations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="mono text-2xs text-warn">Could not load Aria</p>
                <p className="text-xs text-mute">{loadError}</p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="mono text-2xs px-3 py-1.5 border rounded-md"
                  style={{ borderColor: "var(--line)" }}
                >
                  Retry
                </button>
              </div>
            ) : loading ? (
              <div className="flex-1 flex items-center justify-center mono text-2xs text-mute">loading…</div>
            ) : !active ? (
              <div className="flex-1 flex items-center justify-center mono text-2xs text-mute">Select a thread</div>
            ) : (
              <>
                <div
                  className="flex items-center justify-between gap-3 px-4 py-2 border-b mono text-2xs shrink-0"
                  style={{ borderColor: "var(--line)", color: "var(--mute-2)" }}
                >
                  <span className="text-ink font-medium truncate">{active.title}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span>
                      context: full · {active.messageCount} messages
                      {meta?.marketAvailable && " · market live"}
                    </span>
                    {active.decisionType && (
                      <button
                        type="button"
                        onClick={() => void deleteThread(active.id, active.title)}
                        className="inline-flex items-center gap-1 rounded px-2 py-0.5 transition-colors hover:bg-bg-sub"
                        style={{ border: "1px solid var(--line)", color: "var(--mute)", background: "transparent", cursor: "pointer" }}
                      >
                        <Trash2 size={11} />
                        delete
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
                  {active.messages.length === 0 && (
                    <p className="mono text-2xs text-mute-2 text-center py-8">
                      Start a conversation — Aria uses your profile, journal, paths, and market signals.
                    </p>
                  )}
                  {active.messages.map((m) => (
                    <AriaMessageBubble key={m.id} role={m.role} content={m.content} />
                  ))}
                  <AnimatePresence>{sending && <TypingIndicator avatar="a" />}</AnimatePresence>
                  {lastSkillProposals.length > 0 && (
                    <div className="flex flex-wrap gap-2 py-2">
                      {lastSkillProposals.map((p) => (
                        <Link
                          key={p.id}
                          href={`/dashboard/skills?highlight=${p.id}` as Route}
                          className="mono inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-2xs border"
                          style={{
                            borderColor: "var(--accent-line)",
                            background: "var(--accent-soft)",
                            color: "var(--accent)",
                            textDecoration: "none",
                          }}
                        >
                          + Add {p.displayName} to skills
                        </Link>
                      ))}
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                {(suggestedPrompts.length > 0 || suggestedActions.length > 0) && (
                  <div className="px-4 pb-2 flex flex-col gap-2 shrink-0">
                    <div className="flex flex-wrap gap-2">
                      {suggestedPrompts.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => sendMessage(p)}
                          disabled={sending || isPending}
                          className="mono text-2xs px-2.5 py-1.5 rounded-full border transition-colors hover:bg-bg-sub disabled:opacity-40"
                          style={{ borderColor: "var(--line-2)", color: "var(--mute)" }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    {suggestedActions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {suggestedActions.map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => handleAction(a)}
                            disabled={isPending}
                            className="mono text-2xs px-2.5 py-1.5 rounded border transition-colors hover:bg-accent-soft disabled:opacity-40"
                            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <form
                  className="border-t px-4 py-3 flex gap-2 items-end shrink-0"
                  style={{ borderColor: "var(--line)" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    void sendMessage();
                  }}
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Continue the thread…"
                    rows={2}
                    className="flex-1 resize-none rounded-md border px-3 py-2 text-sm bg-bg text-ink outline-none focus:border-line-2"
                    style={{ borderColor: "var(--line)" }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="mono text-2xs px-4 py-2 rounded-md border shrink-0 disabled:opacity-40"
                    style={{ borderColor: "var(--ink)", background: "var(--ink)", color: "var(--bg)" }}
                  >
                    Send ↵
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        <p className="mono text-2xs text-mute-3">
          Advice is perspective, not legal or financial guidance.{" "}
          <Link href="/dashboard/journal" className="underline hover:text-mute">
            Journal
          </Link>
          {" · "}
          <Link href="/dashboard/career-journey" className="underline hover:text-mute">
            Career journey
          </Link>
        </p>
      </div>
    </div>
  );
}

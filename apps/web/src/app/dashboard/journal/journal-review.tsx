"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

import { TypingIndicator } from "@/components/onboarding/typing-indicator";
import { api } from "@/lib/api";

import { dateRangeFromDays, REVIEW_RANGES } from "./journal-utils";

type ReviewSection = {
  theme: string;
  bullets: Array<{ text: string; sourceEventId?: string }>;
};

type Props = {
  onScrollToEntry?: (eventId: string) => void;
};

export function JournalReviewTab({ onScrollToEntry }: Props) {
  const [rangeDays, setRangeDays] = useState(90);
  const [sections, setSections] = useState<ReviewSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async (days: number) => {
    setLoading(true);
    try {
      const { from: f, to: t } = dateRangeFromDays(days);
      const data = await api.journal.reviewPrep(f, t);
      setSections(data.sections);
      setFrom(data.from);
      setTo(data.to);
    } catch {
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(rangeDays);
  }, [rangeDays, load]);

  const copyAll = () => {
    const md = sections
      .map((s) => `## ${s.theme}\n${s.bullets.map((b) => `- ${b.text}`).join("\n")}`)
      .join("\n\n");
    void navigator.clipboard.writeText(md);
  };

  const exportMarkdown = () => {
    const md = `# Review prep\n_${new Date(from).toLocaleDateString()} – ${new Date(to).toLocaleDateString()}_\n\n${sections
      .map((s) => `## ${s.theme}\n${s.bullets.map((b) => `- ${b.text}`).join("\n")}`)
      .join("\n\n")}`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "review-prep.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-1">
          {REVIEW_RANGES.map(({ label, days }) => (
            <button
              key={days}
              type="button"
              onClick={() => setRangeDays(days)}
              className="mono rounded px-2 py-1"
              style={{
                fontSize: 9,
                border: "1px solid",
                borderColor: rangeDays === days ? "var(--accent-line)" : "var(--line)",
                background: rangeDays === days ? "var(--accent-soft)" : "transparent",
                color: rangeDays === days ? "var(--accent)" : "var(--mute)",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {sections.length > 0 && !loading && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={copyAll}
              className="mono rounded px-2 py-1"
              style={{
                fontSize: 9,
                border: "1px solid var(--line)",
                background: "var(--bg-sub)",
                color: "var(--mute)",
                cursor: "pointer",
              }}
            >
              copy all
            </button>
            <button
              type="button"
              onClick={exportMarkdown}
              className="mono rounded px-2 py-1"
              style={{
                fontSize: 9,
                border: "1px solid var(--line)",
                background: "var(--bg-sub)",
                color: "var(--mute)",
                cursor: "pointer",
              }}
            >
              export markdown
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TypingIndicator />
            <p className="mono mt-3" style={{ fontSize: 9, color: "var(--mute-2)" }}>
            Rewriting accomplishments and feedback as impact bullets…
            </p>
          </motion.div>
        ) : sections.length === 0 ? (
          <motion.p
            key="empty"
            className="mono"
            style={{ fontSize: "var(--text-xs)", color: "var(--mute-2)" }}
          >
            Log accomplishments and feedback to generate review prep.
          </motion.p>
        ) : (
          <motion.div key="sections" className="flex flex-col gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {sections.map((section) => (
              <div
                key={section.theme}
                className="rounded-lg p-4"
                style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
              >
                <div
                  className="mono mb-3"
                  style={{ fontSize: 9, color: "var(--mute-2)", letterSpacing: "0.06em" }}
                >
                  {section.theme}
                </div>
                <ul className="flex flex-col gap-2">
                  {section.bullets.map((bullet, i) => (
                    <li
                      key={`${section.theme}-${i}`}
                      className="flex items-start gap-2"
                      style={{ fontSize: "var(--text-xs)", color: "var(--ink)", lineHeight: 1.55 }}
                    >
                      <span style={{ color: "var(--accent)", flexShrink: 0 }}>·</span>
                      <span className="flex-1">{bullet.text}</span>
                      {bullet.sourceEventId && onScrollToEntry && (
                        <button
                          type="button"
                          onClick={() => onScrollToEntry(bullet.sourceEventId!)}
                          className="mono flex-shrink-0"
                          style={{
                            fontSize: 8,
                            color: "var(--mute-3)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          source
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

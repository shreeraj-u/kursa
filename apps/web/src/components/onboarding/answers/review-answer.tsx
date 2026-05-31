import { useMemo } from "react";

import { Button } from "@kursa/ui/components/button";

import type { OnboardingReviewIssue, OnboardingReviewResponse } from "@kursa/types";
import type { FormState } from "../types";

type ReviewAnswerProps = {
  form: FormState;
  review: OnboardingReviewResponse | null;
  appliedCleanupCount: number;
  isSaving: boolean;
  isReviewing: boolean;
  onBack: () => void;
  onSubmit: () => void;
  onAcceptSuggestion: (issueId: string, path: string, value: unknown) => void;
};

function IssueList(props: {
  title: string;
  tone: "warning" | "suggestion";
  issues: OnboardingReviewIssue[];
  onAcceptSuggestion: (issueId: string, path: string, value: unknown) => void;
}) {
  if (props.issues.length === 0) return null;

  const toneClass = {
    warning: "border-amber-300 bg-amber-50 text-amber-950",
    suggestion: "border-blue-200 bg-blue-50 text-blue-950",
  }[props.tone];

  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <p className="text-sm font-semibold">{props.title}</p>
      <div className="mt-2 grid gap-2">
        {props.issues.map((issue) => (
          <div key={issue.id} className="rounded-md bg-white/55 p-2 text-xs">
            <p className="font-medium">{issue.path}</p>
            <p>{issue.message}</p>
            {issue.proposedValue !== undefined ? (
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="line-clamp-2 text-[11px] opacity-80">Suggested: {String(issue.proposedValue)}</p>
                <Button type="button" size="sm" variant="outline" onClick={() => props.onAcceptSuggestion(issue.id, issue.path, issue.proposedValue)}>
                  Apply
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}


const WORK_ENVIRONMENT_LABELS: Record<string, string> = {
  startup: "Startup",
  corporate: "Corporate",
  remote: "Remote-first",
  hybrid: "Hybrid",
};

const RISK_APPETITE_LABELS: Record<string, string> = {
  stability_seeking: "Stability seeking",
  balanced: "Balanced",
  high_growth: "High growth",
};

function displayLabel(value: string | null | undefined, labels?: Record<string, string>): string {
  if (!value) return "—";
  return labels?.[value] ?? value;
}

function AiCleanupLoading() {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 text-sm text-ink shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-accent" />
        <div>
          <p className="font-semibold">AI is cleaning up your profile…</p>
          <p className="text-mute">Kursa is polishing wording, checking consistency, and adding grounded detail where your answers are thin.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        <div className="h-2 w-full animate-pulse rounded bg-line" />
        <div className="h-2 w-5/6 animate-pulse rounded bg-line" />
        <div className="h-2 w-2/3 animate-pulse rounded bg-line" />
      </div>
    </div>
  );
}

export function ReviewAnswer(props: ReviewAnswerProps) {
  const summary = useMemo(() => {
    const byCategory = props.form.skills.reduce<Record<string, number>>((acc, skill) => {
      acc[skill.category] = (acc[skill.category] ?? 0) + 1;
      return acc;
    }, {});
    return { skillCount: props.form.skills.length, byCategory, workCount: props.form.workHistory.length };
  }, [props.form.skills, props.form.workHistory]);

  const cleanupCount = props.appliedCleanupCount + (props.review?.warnings.length ?? 0) + (props.review?.suggestions.length ?? 0);

  return (
    <div className="flex flex-col gap-3">
      {props.review ? (
        <div className="grid gap-2">
          <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-950">
            <p className="font-semibold">AI cleaned this up</p>
            <p className="mt-1">
              {props.appliedCleanupCount > 0
                ? `Applied ${props.appliedCleanupCount} safe ${props.appliedCleanupCount === 1 ? "improvement" : "improvements"}. You can still review any remaining notes or finish now.`
                : cleanupCount > 0
                  ? `Kursa found ${cleanupCount} non-blocking cleanup ${cleanupCount === 1 ? "note" : "notes"}. Apply any suggestions you like, or finish now.`
                  : "Kursa reviewed your profile and did not find anything that needs cleanup."}
            </p>
          </div>
          <IssueList title="Things AI noticed" tone="warning" issues={props.review.warnings} onAcceptSuggestion={props.onAcceptSuggestion} />
          <IssueList title="Optional AI cleanup suggestions" tone="suggestion" issues={props.review.suggestions} onAcceptSuggestion={props.onAcceptSuggestion} />
        </div>
      ) : (
        <AiCleanupLoading />
      )}

      <div className="grid gap-2 rounded-lg p-3 border border-line bg-surface">
        <div className="text-sm text-ink">
          <p>
            <strong>Target role:</strong> {props.form.basics.targetRole || "—"} ·{" "}
            <strong>Location:</strong> {props.form.basics.location || "—"} ·{" "}
            <strong>Experience:</strong> {props.form.basics.yearsOfExperience || "—"}y
          </p>
          <p className="mt-1">
            <strong>Skills:</strong> {summary.skillCount} (
            {Object.entries(summary.byCategory)
              .map(([cat, count]) => `${count} ${cat}`)
              .join(", ") || "none"}
            )
          </p>
          <p><strong>Experience entries:</strong> {summary.workCount}</p>
          <p>
            <strong>Projects:</strong> {props.form.projects.length} ·{" "}
            <strong>Achievements:</strong> {props.form.achievements.length}
          </p>
          <p>
            <strong>Education:</strong> {props.form.education.length} ·{" "}
            <strong>Languages:</strong> {props.form.languages.length} ·{" "}
            <strong>Links:</strong> {props.form.socialLinks.length}
          </p>
          <p>
            <strong>Environment:</strong> {displayLabel(props.form.values.workEnvironment, WORK_ENVIRONMENT_LABELS)} ·{" "}
            <strong>Risk:</strong> {displayLabel(props.form.values.riskAppetite, RISK_APPETITE_LABELS)}
          </p>
          <p><strong>Salary:</strong> {props.form.values.salaryExpectation || "—"}</p>
          <p><strong>Working style:</strong> {props.form.values.workingStyle || "—"}</p>
          <p>
            <strong>Targets:</strong> {props.form.aspirations.targetRoles || "—"} ·{" "}
            {props.form.aspirations.targetIndustries || "—"}
          </p>
          <p><strong>3y:</strong> {props.form.aspirations.horizon3y || "—"}</p>
          <p><strong>5y:</strong> {props.form.aspirations.horizon5y || "—"}</p>
        </div>
      </div>
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={props.onBack} disabled={props.isSaving || props.isReviewing}>Back</Button>
        <Button type="button" onClick={props.onSubmit} disabled={props.isSaving || props.isReviewing || !props.review}>
          {props.isSaving ? "Saving..." : props.isReviewing || !props.review ? "Cleaning up..." : "Finish & save"}
        </Button>
      </div>
    </div>
  );
}

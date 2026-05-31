import { useMemo } from "react";

import { Button } from "@kursa/ui/components/button";

import type { OnboardingReviewIssue, OnboardingReviewResponse } from "@kursa/types";
import type { FormState } from "../types";

type ReviewAnswerProps = {
  form: FormState;
  review: OnboardingReviewResponse | null;
  isSaving: boolean;
  isReviewing: boolean;
  onBack: () => void;
  onSubmit: () => void;
  onAcceptSuggestion: (path: string, value: unknown) => void;
};

function IssueList(props: {
  title: string;
  tone: "critical" | "warning" | "suggestion";
  issues: OnboardingReviewIssue[];
  onAcceptSuggestion: (path: string, value: unknown) => void;
}) {
  if (props.issues.length === 0) return null;

  const toneClass = {
    critical: "border-red-300 bg-red-50 text-red-950",
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
            {props.tone === "suggestion" && issue.proposedValue !== undefined ? (
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="line-clamp-2 text-[11px] opacity-80">Suggested: {String(issue.proposedValue)}</p>
                <Button type="button" size="sm" variant="outline" onClick={() => props.onAcceptSuggestion(issue.path, issue.proposedValue)}>
                  Accept
                </Button>
              </div>
            ) : null}
          </div>
        ))}
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

  const criticalCount = props.review?.criticalIssues.length ?? 0;
  const isBlocked = criticalCount > 0;

  return (
    <div className="flex flex-col gap-3">
      {props.review ? (
        <div className="grid gap-2">
          <IssueList title="Critical issues to fix before saving" tone="critical" issues={props.review.criticalIssues} onAcceptSuggestion={props.onAcceptSuggestion} />
          <IssueList title="Warnings to check" tone="warning" issues={props.review.warnings} onAcceptSuggestion={props.onAcceptSuggestion} />
          <IssueList title="Optional suggestions" tone="suggestion" issues={props.review.suggestions} onAcceptSuggestion={props.onAcceptSuggestion} />
          {props.review.status === "ready" ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-950">
              Profile intake review found no blockers.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-lg border border-line bg-bg-sub p-3 text-sm text-mute">
          Review is loading. If this persists, go back and run the review again.
        </div>
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
            <strong>Environment:</strong> {props.form.values.workEnvironment || "—"} ·{" "}
            <strong>Risk:</strong> {props.form.values.riskAppetite || "—"}
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
        <Button type="button" onClick={props.onSubmit} disabled={props.isSaving || props.isReviewing || isBlocked}>
          {props.isSaving ? "Saving..." : isBlocked ? `Fix ${criticalCount} issue${criticalCount === 1 ? "" : "s"}` : "Finish & save"}
        </Button>
      </div>
    </div>
  );
}

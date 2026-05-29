import { useMemo } from "react";

import { Button } from "@kursa/ui/components/button";

import type { FormState } from "../types";

type ReviewAnswerProps = {
  form: FormState;
  isSaving: boolean;
  onBack: () => void;
  onSubmit: () => void;
};

export function ReviewAnswer(props: ReviewAnswerProps) {
  const summary = useMemo(() => {
    const byCategory = props.form.skills.reduce<Record<string, number>>((acc, skill) => {
      acc[skill.category] = (acc[skill.category] ?? 0) + 1;
      return acc;
    }, {});
    return { skillCount: props.form.skills.length, byCategory, workCount: props.form.workHistory.length };
  }, [props.form.skills, props.form.workHistory]);

  return (
    <div className="flex flex-col gap-3">
      <div
        className="grid gap-2 rounded-lg p-3"
        style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
      >
        <div style={{ fontSize: "var(--text-sm)", color: "var(--ink)" }}>
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
        <Button type="button" variant="outline" onClick={props.onBack} disabled={props.isSaving}>Back</Button>
        <Button type="button" onClick={props.onSubmit} disabled={props.isSaving}>
          {props.isSaving ? "Saving..." : "Finish & save"}
        </Button>
      </div>
    </div>
  );
}

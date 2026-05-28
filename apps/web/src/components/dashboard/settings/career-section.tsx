"use client";

import { useForm } from "@tanstack/react-form";
import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";
import { Label } from "@kursa/ui/components/label";
import { toast } from "sonner";
import z from "zod";

import { api } from "@/lib/api";
import type { UserProfile } from "@/types/profile";
import { SectionHeader, FormField } from "./settings-ui";
import { normalizeCareerDefaults, serializeCareerSubmission } from "./career-section.utils";
import { SectionDivider, ToggleGroup, Textarea } from "./settings-controls";

const WORK_ENV_OPTIONS = [
  { value: "startup", label: "Startup" },
  { value: "corporate", label: "Corporate" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

const RISK_OPTIONS = [
  { value: "stability_seeking", label: "Stability" },
  { value: "balanced", label: "Balanced" },
  { value: "high_growth", label: "High-growth" },
];

const TEAM_SIZE_OPTIONS = [
  { value: "small", label: "Small (1–20)" },
  { value: "medium", label: "Medium (20–200)" },
  { value: "large", label: "Large (200+)" },
  { value: "any", label: "No preference" },
];

const CURRENCIES = ["USD", "GBP", "EUR", "CAD", "AUD", "SGD", "INR"];

const schema = z.object({
  targetRole: z.string().max(200),
  yearsOfExperience: z.number().int().min(0).max(60).nullable(),
  workEnvironment: z.string(),
  riskAppetite: z.string(),
  teamSizePreference: z.string(),
  minSalary: z.number().nullable(),
  maxSalary: z.number().nullable(),
  currency: z.string(),
  geographicConstraints: z.string(),
  targetRoles: z.string(),
  targetIndustries: z.string(),
  threeYear: z.string().max(500),
  fiveYear: z.string().max(500),
  successDefinition: z.string().max(1000),
});

export default function CareerSection({ profile }: { profile: UserProfile | null }) {
  const form = useForm({
    defaultValues: normalizeCareerDefaults(profile),
    onSubmit: async ({ value }) => {
      try {
        await api.updateProfile(serializeCareerSubmission(value));
        toast.success("Career preferences saved");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    },
    validators: { onSubmit: schema },
  });

  return (
    <div>
      <SectionHeader
        eyebrow="career"
        title="Career preferences"
        description="Shape how Kursa understands your career direction and generates paths for you."
      />

      <div className="rounded-xl p-6 bg-surface border border-line">
        <form
          onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}
          className="flex flex-col gap-5"
        >
          {/* ── Role ── */}
          <div className="flex gap-4">
            <form.Field name="targetRole">
              {(field) => (
                <FormField label="Target role" htmlFor={field.name} errors={field.state.meta.errors} className="flex-1">
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. Senior Product Manager"
                  />
                </FormField>
              )}
            </form.Field>

            <form.Field name="yearsOfExperience">
              {(field) => (
                <FormField label="Years exp." htmlFor={field.name} errors={field.state.meta.errors} className="w-[140px]">
                  <Input
                    id={field.name}
                    type="number"
                    min={0}
                    max={60}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value === "" ? null : parseInt(e.target.value, 10))}
                    placeholder="5"
                  />
                </FormField>
              )}
            </form.Field>
          </div>

          <SectionDivider label="Work style" />

          {/* Work environment */}
          <form.Field name="workEnvironment">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label style={{ fontSize: "var(--text-sm)" }}>Work environment</Label>
                <ToggleGroup
                  options={WORK_ENV_OPTIONS}
                  value={field.state.value}
                  onChange={field.handleChange}
                />
              </div>
            )}
          </form.Field>

          {/* Risk appetite */}
          <form.Field name="riskAppetite">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label style={{ fontSize: "var(--text-sm)" }}>Risk appetite</Label>
                <ToggleGroup
                  options={RISK_OPTIONS}
                  value={field.state.value}
                  onChange={field.handleChange}
                />
              </div>
            )}
          </form.Field>

          {/* Team size */}
          <form.Field name="teamSizePreference">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label style={{ fontSize: "var(--text-sm)" }}>Team size preference</Label>
                <ToggleGroup
                  options={TEAM_SIZE_OPTIONS}
                  value={field.state.value}
                  onChange={field.handleChange}
                />
              </div>
            )}
          </form.Field>

          <SectionDivider label="Compensation" />

          {/* Salary range + currency */}
          <div className="flex gap-3 items-end">
            <form.Field name="minSalary">
              {(field) => (
                <FormField
                  label={<>Min salary <span className="text-mute">· optional</span></>}
                  htmlFor={field.name}
                  errors={field.state.meta.errors}
                  className="flex-1"
                >
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                    placeholder="80,000"
                  />
                </FormField>
              )}
            </form.Field>

            <form.Field name="maxSalary">
              {(field) => (
                <FormField
                  label={<>Max salary <span className="text-mute">· optional</span></>}
                  htmlFor={field.name}
                  errors={field.state.meta.errors}
                  className="flex-1"
                >
                  <Input
                    id={field.name}
                    type="number"
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                    placeholder="140,000"
                  />
                </FormField>
              )}
            </form.Field>

            <form.Field name="currency">
              {(field) => (
                <div className="flex flex-col gap-1.5 w-[90px]">
                  <Label htmlFor={field.name} style={{ fontSize: "var(--text-sm)" }}>Currency</Label>
                  <select
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    style={{ fontSize: "var(--text-base)" }}
                    className="h-8 rounded-lg px-2 text-ink bg-surface border border-line-2 outline-none cursor-pointer"
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </form.Field>
          </div>

          {/* Geographic constraints */}
          <form.Field name="geographicConstraints">
            {(field) => (
              <FormField
                label={<>Where won't you work?{" "}<span className="mono text-mute" style={{ fontSize: "var(--text-xs)" }}>· comma-separated</span></>}
                htmlFor={field.name}
                errors={field.state.meta.errors}
              >
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="No relocation, must be remote, London only..."
                />
              </FormField>
            )}
          </form.Field>

          <SectionDivider label="Aspirations" />

          {/* Target roles */}
          <form.Field name="targetRoles">
            {(field) => (
              <FormField
                label={<>Target roles{" "}<span className="mono text-mute" style={{ fontSize: "var(--text-xs)" }}>· comma-separated</span></>}
                htmlFor={field.name}
                errors={field.state.meta.errors}
              >
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Senior PM, Director of Product, VP Product"
                />
              </FormField>
            )}
          </form.Field>

          {/* Target industries */}
          <form.Field name="targetIndustries">
            {(field) => (
              <FormField
                label={<>Target industries{" "}<span className="mono text-mute" style={{ fontSize: "var(--text-xs)" }}>· comma-separated</span></>}
                htmlFor={field.name}
                errors={field.state.meta.errors}
              >
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Fintech, Climate tech, Healthcare AI"
                />
              </FormField>
            )}
          </form.Field>

          {/* 3-year goal */}
          <form.Field name="threeYear">
            {(field) => (
              <FormField
                label={<>Where do you want to be in 3 years?{" "}<span className="text-mute">· optional</span></>}
                htmlFor={field.name}
                errors={field.state.meta.errors}
              >
                <Textarea
                  id={field.name}
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  placeholder="e.g. Leading product at a Series B company, managing a team of 5..."
                  rows={2}
                />
              </FormField>
            )}
          </form.Field>

          {/* 5-year goal */}
          <form.Field name="fiveYear">
            {(field) => (
              <FormField
                label={<>Where do you want to be in 5 years?{" "}<span className="text-mute">· optional</span></>}
                htmlFor={field.name}
                errors={field.state.meta.errors}
              >
                <Textarea
                  id={field.name}
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  placeholder="e.g. VP of Product at a company I believe in, or building my own..."
                  rows={2}
                />
              </FormField>
            )}
          </form.Field>

          {/* Success definition */}
          <form.Field name="successDefinition">
            {(field) => (
              <FormField
                label={<>How do you define career success?{" "}<span className="text-mute">· optional</span></>}
                htmlFor={field.name}
                errors={field.state.meta.errors}
              >
                <Textarea
                  id={field.name}
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  placeholder="e.g. Leading a product team at a company I believe in, with time to build outside of work..."
                  rows={3}
                />
              </FormField>
            )}
          </form.Field>

          <div className="flex justify-end pt-1">
            <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
              {({ canSubmit, isSubmitting }) => (
                <Button type="submit" size="sm" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? "Saving…" : "Save changes"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </div>
    </div>
  );
}

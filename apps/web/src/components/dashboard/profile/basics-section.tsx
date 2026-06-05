"use client";

import { useForm } from "@tanstack/react-form";
import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";
import { toast } from "sonner";
import z from "zod";

import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import type { UserProfile } from "@/types/profile";
import { FormField } from "@/components/dashboard/settings/settings-ui";
import { Textarea } from "@/components/dashboard/settings/settings-controls";

interface Props {
  profile: UserProfile | null;
  user: { name: string; email: string };
}

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  bio: z.string().max(2000),
  location: z.string().max(200),
});

export default function BasicsSection({ profile, user }: Props) {
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const form = useForm({
    defaultValues: {
      name: user.name,
      bio: profile?.bio ?? "",
      location: profile?.location ?? "",
    },
    onSubmit: async ({ value }) => {
      try {
        if (value.name !== user.name) {
          const { error } = await authClient.updateUser({ name: value.name });
          if (error) throw new Error(error.message ?? "Failed to update name");
        }
        await api.updateProfile({ bio: value.bio || null, location: value.location || null });
        toast.success("Profile updated");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    },
    validators: { onSubmit: schema },
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-bg-sub border border-line">
        <div
          className="mono flex items-center justify-center shrink-0 w-12 h-12 rounded-full bg-bg-sub-2 border border-line-2 text-ink-2 font-semibold"
          style={{ fontSize: "var(--text-md)" }}
        >
          {initials}
        </div>
        <div>
          <p className="text-ink font-medium" style={{ fontSize: "var(--text-base)" }}>
            {user.name}
          </p>
          <p className="mono text-mute" style={{ fontSize: "var(--text-sm)" }}>
            {user.email}
          </p>
        </div>
      </div>

      <div className="rounded-xl p-6 bg-bg-sub border border-line">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="flex flex-col gap-5"
        >
          <form.Field name="name">
            {(field) => (
              <FormField label="Display name" htmlFor={field.name} errors={field.state.meta.errors}>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Alex Morgan"
                  style={{ fontSize: "var(--text-base)" }}
                />
              </FormField>
            )}
          </form.Field>

          <form.Field name="bio">
            {(field) => (
              <FormField
                label={<>Bio <span className="text-mute">· optional</span></>}
                htmlFor={field.name}
                errors={field.state.meta.errors}
              >
                <Textarea
                  id={field.name}
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                  placeholder="A short bio about you and your career..."
                  rows={3}
                />
              </FormField>
            )}
          </form.Field>

          <form.Field name="location">
            {(field) => (
              <FormField
                label={<>Location <span className="text-mute">· optional</span></>}
                htmlFor={field.name}
                errors={field.state.meta.errors}
              >
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="San Francisco, CA"
                  style={{ fontSize: "var(--text-base)" }}
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

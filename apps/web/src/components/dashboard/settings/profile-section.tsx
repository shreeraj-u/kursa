"use client";

import { useForm } from "@tanstack/react-form";
import { env } from "@kursa/env/web";
import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import type { UserProfile } from "@/types/profile";
import { SectionHeader, FormField } from "./settings-ui";
import { Textarea } from "./settings-controls";

interface Props {
  profile: UserProfile | null;
  user: { name: string; email: string };
}

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  bio: z.string().max(2000),
  location: z.string().max(200),
});

export default function ProfileSection({ profile, user }: Props) {
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
        const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/api/v1/profile/me`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bio: value.bio || null, location: value.location || null }),
        });
        if (!res.ok) throw new Error("Failed to update profile");
        toast.success("Profile updated");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    },
    validators: { onSubmit: schema },
  });

  return (
    <div>
      <SectionHeader
        eyebrow="profile"
        title="Profile"
        description="Your public identity on Kursa."
      />

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-surface border border-line">
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

      {/* Form */}
      <div className="rounded-xl p-6 bg-surface border border-line">
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

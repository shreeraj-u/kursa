"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";
import { Label } from "@kursa/ui/components/label";
import { SectionHeader, FormField } from "./settings-ui";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function PasswordForm() {
  const form = useForm({
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    onSubmit: async ({ value }) => {
      const { error } = await authClient.changePassword({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
      });
      if (error) {
        toast.error(error.message ?? "Failed to change password");
        return;
      }
      toast.success("Password updated");
      form.reset();
    },
    validators: { onSubmit: passwordSchema },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="flex flex-col gap-4 mt-4"
    >
      {(["currentPassword", "newPassword", "confirmPassword"] as const).map((name) => (
        <form.Field key={name} name={name}>
          {(field) => (
            <FormField
              label={
                name === "currentPassword"
                  ? "Current password"
                  : name === "newPassword"
                    ? "New password"
                    : "Confirm new password"
              }
              htmlFor={field.name}
              errors={field.state.meta.errors}
            >
              <Input
                id={field.name}
                type="password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </FormField>
          )}
        </form.Field>
      ))}
      <div>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" size="sm" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Updating…" : "Update password"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

function DeleteAccountSection() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const { error } = await authClient.deleteUser();
      if (error) throw new Error(error.message ?? "Failed to delete account");
      toast.success("Account deleted");
      router.push("/");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="rounded-xl p-6 bg-surface border border-line">
      <h3
        className="font-semibold text-warn mb-1"
        style={{ fontSize: "var(--text-lg)" }}
      >
        Delete account
      </h3>
      <p className="text-mute mt-1" style={{ fontSize: "var(--text-base)" }}>
        Permanently delete your account and all data. This cannot be undone.
      </p>
      <div className="mt-4">
        {!confirming ? (
          <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
            Delete account
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-mute" style={{ fontSize: "var(--text-base)" }}>
              Are you sure? All your data will be permanently deleted.
            </p>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Yes, delete everything"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirming(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountSection({ user }: { user: { name: string; email: string } }) {
  return (
    <div>
      <SectionHeader
        eyebrow="account"
        title="Account"
        description="Manage your login credentials and account security."
      />
      <div className="flex flex-col gap-6">
        {/* Email (read-only) */}
        <div className="rounded-xl p-6 bg-surface border border-line">
          <div className="flex flex-col gap-1.5">
            <Label style={{ fontSize: "var(--text-sm)" }}>Email address</Label>
            <div className="flex items-center gap-2">
              <p className="text-mute mt-1" style={{ fontSize: "var(--text-base)" }}>
                {user.email}
              </p>
              <span
                className="mono text-mute-3 bg-bg-sub-2 px-1.5 py-[1px] rounded border border-line"
                style={{ fontSize: "var(--text-xs)" }}
              >
                verified
              </span>
            </div>
          </div>
        </div>

        {/* Password change */}
        <div className="rounded-xl p-6 bg-surface border border-line">
          <h3
            className="font-semibold text-ink mb-1"
            style={{ fontSize: "var(--text-lg)" }}
          >
            Change password
          </h3>
          <p className="text-mute mt-1" style={{ fontSize: "var(--text-base)" }}>
            Update your password to keep your account secure.
          </p>
          <PasswordForm />
        </div>

        {/* Danger zone */}
        <DeleteAccountSection />
      </div>
    </div>
  );
}

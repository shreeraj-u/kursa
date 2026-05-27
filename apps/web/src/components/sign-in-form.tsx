"use client";

import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";
import { Label } from "@kursa/ui/components/label";

import Loader from "./loader";

export default function SignInForm({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
  const router = useRouter();
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        { email: value.email, password: value.password },
        {
          onSuccess: () => {
            router.push("/dashboard");
            toast.success("Sign in successful");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  if (isPending) return <Loader />;

  return (
    <div
      className="w-full rounded-xl p-8"
      style={{
        maxWidth: 400,
        border: "1px solid var(--line)",
        background: "var(--surface)",
      }}
    >
      {/* Heading */}
      <div className="mb-7">
        <div className="eyebrow mono mb-1.5">welcome back</div>
        <h1
          className="font-semibold tracking-tight text-[var(--ink)]"
          style={{ fontSize: "var(--text-2xl)" }}
        >
          Sign in to Kursa
        </h1>
      </div>

      {/* Email + password form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <form.Field name="email">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={field.name} style={{ fontSize: "var(--text-sm)" }}>
                Email
              </Label>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                placeholder="you@company.com"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map((error) => (
                <p
                  key={error?.message}
                  style={{ fontSize: "var(--text-xs)", color: "var(--warn)" }}
                >
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={field.name} style={{ fontSize: "var(--text-sm)" }}>
                Password
              </Label>
              <Input
                id={field.name}
                name={field.name}
                type="password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors.map((error) => (
                <p
                  key={error?.message}
                  style={{ fontSize: "var(--text-xs)", color: "var(--warn)" }}
                >
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button
              type="submit"
              className="w-full mt-1"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div
          className="absolute inset-0 flex items-center"
          aria-hidden
        >
          <div className="w-full" style={{ borderTop: "1px solid var(--line)" }} />
        </div>
        <div className="relative flex justify-center">
          <span
            className="px-3"
            style={{
              background: "var(--surface)",
              fontSize: "var(--text-xs)",
              color: "var(--mute)",
            }}
          >
            or continue with
          </span>
        </div>
      </div>

      {/* GitHub OAuth */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={async () => {
          await authClient.signIn.social({ provider: "github", callbackURL: `${window.location.origin}/dashboard` });
        }}
      >
        <GitHubLogoIcon className="mr-2 h-4 w-4" />
        GitHub
      </Button>

      {/* Switch to sign up */}
      <p
        className="text-center mt-6"
        style={{ fontSize: "var(--text-sm)", color: "var(--mute)" }}
      >
        No account?{" "}
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="transition-colors"
          style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: 3 }}
        >
          Create one
        </button>
      </p>
    </div>
  );
}

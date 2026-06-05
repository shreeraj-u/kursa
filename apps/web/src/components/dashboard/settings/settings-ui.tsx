"use client";

import { cn } from "@kursa/ui/lib/utils";
import { Label } from "@kursa/ui/components/label";

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div
        className="mono mb-1 text-mute tracking-[0.06em] uppercase"
        style={{ fontSize: "var(--text-xs)" }}
      >
        {eyebrow}
      </div>
      <h2
        className="font-semibold text-ink"
        style={{ fontSize: "var(--text-2xl)" }}
      >
        {title}
      </h2>
      <p className="text-mute mt-1" style={{ fontSize: "var(--text-base)" }}>
        {description}
      </p>
    </div>
  );
}

export function FormField({
  label,
  htmlFor,
  errors,
  className,
  children,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  errors?: ReadonlyArray<{ message?: string } | null | undefined>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor} style={{ fontSize: "var(--text-sm)" }}>
        {label}
      </Label>
      {children}
      {errors?.map((e, i) =>
        e?.message ? (
          <p
            key={`${i}:${e.message}`}
            className="text-warn"
            style={{ fontSize: "var(--text-xs)" }}
          >
            {e.message}
          </p>
        ) : null,
      )}
    </div>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <p className="text-warn" style={{ fontSize: "var(--text-xs)" }}>
      {message}
    </p>
  );
}

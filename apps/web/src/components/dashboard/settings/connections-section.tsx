"use client";

import { useState } from "react";
import { Globe, Link } from "lucide-react";
import { GitHubLogoIcon, LinkedInLogoIcon, TwitterLogoIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";

import { env } from "@kursa/env/web";
import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";
import type { UserSocialLink } from "@/types/profile";
import { SectionHeader } from "./settings-ui";

const PLATFORMS = [
  { key: "github", label: "GitHub", Icon: GitHubLogoIcon },
  { key: "linkedin", label: "LinkedIn", Icon: LinkedInLogoIcon },
  { key: "twitter", label: "Twitter / X", Icon: TwitterLogoIcon },
  { key: "website", label: "Website", Icon: Globe },
  { key: "portfolio", label: "Portfolio", Icon: Link },
];

interface LinkRowProps {
  platform: string;
  label: string;
  Icon: React.ElementType;
  existing?: UserSocialLink;
  onSaved: (link: UserSocialLink) => void;
  onDeleted: (id: string) => void;
}

function LinkRow({ platform, label, Icon, existing, onSaved, onDeleted }: LinkRowProps) {
  const [url, setUrl] = useState(existing?.url ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    if (!url.trim()) return;
    setSaving(true);
    try {
      if (existing) {
        const res = await fetch(
          `${env.NEXT_PUBLIC_SERVER_URL}/api/v1/profile/me/social-links/${existing.id}`,
          {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: url.trim() }),
          },
        );
        if (!res.ok) throw new Error("Failed to update");
        const json = await res.json();
        onSaved(json.data.socialLink);
        toast.success(`${label} updated`);
      } else {
        const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/api/v1/profile/me/social-links`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform, url: url.trim() }),
        });
        if (!res.ok) throw new Error("Failed to save");
        const json = await res.json();
        onSaved(json.data.socialLink);
        toast.success(`${label} connected`);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!existing) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${env.NEXT_PUBLIC_SERVER_URL}/api/v1/profile/me/social-links/${existing.id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      if (!res.ok) throw new Error("Failed to remove");
      onDeleted(existing.id);
      setUrl("");
      toast.success(`${label} removed`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeleting(false);
    }
  }

  const isDirty = url !== (existing?.url ?? "");

  return (
    <div className="flex items-center gap-3 py-3 border-b border-line last:border-b-0">
      <div className="flex items-center gap-2.5 shrink-0 w-[110px]">
        <Icon className={`w-[14px] h-[14px] ${existing ? "text-ink-2" : "text-mute-3"}`} />
        <span
          className={existing ? "text-ink-2 font-medium" : "text-mute-2 font-normal"}
          style={{ fontSize: "var(--text-sm)" }}
        >
          {label}
        </span>
      </div>
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder={`https://${
          platform === "github"
            ? "github.com/username"
            : platform === "linkedin"
              ? "linkedin.com/in/username"
              : platform === "twitter"
                ? "x.com/username"
                : "yoursite.com"
        }`}
        className="flex-1"
        style={{ fontSize: "var(--text-sm)" }}
      />
      <div className="flex items-center gap-1.5 shrink-0">
        {isDirty && (
          <Button size="xs" onClick={handleSave} disabled={saving || !url.trim()}>
            {saving ? "…" : existing ? "Update" : "Add"}
          </Button>
        )}
        {existing && !isDirty && (
          <Button
            size="xs"
            variant="ghost"
            onClick={handleDelete}
            disabled={deleting}
            className="text-warn hover:text-warn hover:bg-warn/10"
          >
            {deleting ? "…" : "Remove"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ConnectionsSection({
  socialLinks: initialLinks,
}: {
  socialLinks: UserSocialLink[];
}) {
  const [links, setLinks] = useState<UserSocialLink[]>(initialLinks);

  function handleSaved(link: UserSocialLink) {
    setLinks((prev) => {
      const exists = prev.find((l) => l.id === link.id);
      if (exists) return prev.map((l) => (l.id === link.id ? link : l));
      return [...prev, link];
    });
  }

  function handleDeleted(id: string) {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div>
      <SectionHeader
        eyebrow="connections"
        title="Connections"
        description="Link your profiles so Kursa can build a complete picture of you."
      />

      <div className="rounded-xl px-6 bg-surface border border-line">
        {PLATFORMS.map(({ key, label, Icon }) => (
          <LinkRow
            key={key}
            platform={key}
            label={label}
            Icon={Icon}
            existing={links.find((l) => l.platform === key)}
            onSaved={handleSaved}
            onDeleted={handleDeleted}
          />
        ))}
      </div>
    </div>
  );
}

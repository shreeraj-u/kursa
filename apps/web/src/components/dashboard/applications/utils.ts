import type { JobApplicationStage } from "@kursa/types";

export function stageChipClass(stage: JobApplicationStage): string {
  switch (stage) {
    case "offer":
      return "rounded px-1.5 py-0.5 bg-accent text-white text-3xs font-mono font-medium";
    case "technical":
    case "on_site":
      return "rounded px-1.5 py-0.5 bg-good/10 text-good border border-good/20 text-3xs font-mono font-medium";
    case "shortlisted":
    case "applied":
      return "rounded px-1.5 py-0.5 bg-warn/10 text-warn border border-warn/20 text-3xs font-mono font-medium";
    case "closed":
      return "text-3xs text-mute-3 font-mono";
    default:
      return "rounded px-1.5 py-0.5 bg-bg-sub border border-line text-mute text-3xs font-mono font-medium";
  }
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

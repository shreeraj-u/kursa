export function yearToDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const trimmed = s.trim();
  if (!trimmed) return null;
  const parsed = new Date(/^\d{4}$/.test(trimmed) ? `${trimmed}-01-01` : trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function dateToYear(d: Date | null | undefined): string | null {
  if (!d) return null;
  return String(d.getFullYear());
}

export function outcomesToText(outcomes: unknown | null): string {
  if (outcomes == null) return "";
  if (typeof outcomes === "object" && outcomes !== null && "text" in outcomes) {
    const text = (outcomes as { text?: unknown }).text;
    return typeof text === "string" ? text : "";
  }
  if (typeof outcomes === "string") return outcomes;
  return "";
}

/** BLS OEWS wage lookup via Public Data API v2. */

export interface BlsWageEstimate {
  p25: number;
  p50: number;
  p75: number;
  currency: "USD";
}

const FALLBACK_MEDIAN_USD = 65_000;

/** OEWS series: OEU + areaType + areaCode + industry + occupation + datatype (13 = median annual wage). */
export function buildOewsSeriesId(socCode: string | null, areaType: "N" | "S" = "N", areaCode = "0000000"): string {
  const occ = (normalizeSocDigits(socCode) ?? "000000").padStart(6, "0").slice(-6);
  const industry = "000000";
  const area = areaCode.padStart(7, "0").slice(-7);
  return `OEU${areaType}${area}${industry}${occ}13`;
}

function normalizeSocDigits(socCode: string | null | undefined): string | null {
  if (!socCode?.trim()) return null;
  const digits = socCode.replace(/\D/g, "").slice(0, 6);
  return digits.length >= 6 ? digits : digits.padEnd(6, "0");
}

/** Map common role titles to SOC codes when O*NET is unavailable. */
export function guessSocFromTitle(roleTitle: string): string | null {
  const t = roleTitle.toLowerCase();
  if (t.includes("software") && t.includes("engineer")) return "151252";
  if (t.includes("data scientist")) return "152051";
  if (t.includes("product manager")) return "131111";
  if (t.includes("computer") && t.includes("information") && t.includes("manager")) return "113021";
  if (t.includes("web developer")) return "151254";
  if (t.includes("devops") || t.includes("site reliability")) return "151253";
  if (t.includes("machine learning") || t.includes("ai engineer")) return "151251";
  return null;
}

export async function fetchBlsWagesForRole(
  roleTitle: string,
  apiKey?: string,
  socCode?: string | null,
): Promise<BlsWageEstimate | null> {
  const soc = normalizeSocDigits(socCode) ?? guessSocFromTitle(roleTitle);

  if (!apiKey?.trim()) {
    return estimateFromTitle(roleTitle);
  }

  const seriesid = buildOewsSeriesId(soc, "N", "0000000");

  try {
    const body = {
      seriesid: [seriesid],
      startyear: "2023",
      endyear: "2024",
      registrationkey: apiKey,
    };
    const res = await fetch("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return estimateFromTitle(roleTitle);

    const json = (await res.json()) as {
      status?: string;
      Results?: { series?: Array<{ data?: Array<{ value?: string }> }> };
    };

    if (json.status === "REQUEST_NOT_PROCESSED" || json.status === "REQUEST_FAILED") {
      return estimateFromTitle(roleTitle);
    }

    const val = json.Results?.series?.[0]?.data?.[0]?.value;
    const median = val ? Number.parseFloat(val.replace(/,/g, "")) : NaN;
    if (!Number.isFinite(median) || median <= 0) return estimateFromTitle(roleTitle);

    return {
      p25: Math.round(median * 0.8),
      p50: Math.round(median),
      p75: Math.round(median * 1.25),
      currency: "USD",
    };
  } catch {
    return estimateFromTitle(roleTitle);
  }
}

export function estimateFromTitle(roleTitle: string): BlsWageEstimate {
  const t = roleTitle.toLowerCase();
  let base = FALLBACK_MEDIAN_USD;
  if (t.includes("staff") || t.includes("principal") || t.includes("director")) base = 180_000;
  else if (t.includes("senior") || t.includes("lead")) base = 150_000;
  else if (t.includes("manager") || t.includes("head")) base = 160_000;
  else if (t.includes("junior") || t.includes("associate")) base = 85_000;
  return {
    p25: Math.round(base * 0.82),
    p50: base,
    p75: Math.round(base * 1.22),
    currency: "USD",
  };
}

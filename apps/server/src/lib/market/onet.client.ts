export interface OnetOccupationMatch {
  code: string;
  title: string;
}

/** Normalize O*NET-SOC code to 6-digit SOC for BLS OEWS series. */
export function onetCodeToSoc(code: string): string {
  const digits = code.replace(/\D/g, "").slice(0, 6);
  return digits.padEnd(6, "0");
}

export async function searchOnetOccupation(keyword: string): Promise<OnetOccupationMatch | null> {
  const user = process.env.ONET_USERNAME;
  const pass = process.env.ONET_PASSWORD;
  if (!user || !pass || !keyword.trim()) return null;

  const q = encodeURIComponent(keyword.trim());
  const urls = [
    `https://services.onetcenter.org/ws/online/search?keyword=${q}&end=1`,
    `https://services.onetcenter.org/ws/mnm/search?keyword=${q}&end=1`,
  ];

  const auth = Buffer.from(`${user}:${pass}`).toString("base64");

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as {
        occupation?: Array<{ code?: string; title?: string }>;
        result?: Array<{ code?: string; title?: string }>;
      };
      const first = data.occupation?.[0] ?? data.result?.[0];
      if (!first?.code || !first?.title) continue;
      return { code: first.code, title: first.title };
    } catch {
      continue;
    }
  }
  return null;
}

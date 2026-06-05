import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";

import {
  buildOewsSeriesId,
  estimateFromTitle,
  guessSocFromTitle,
} from "./bls.client.js";
import {
  keywordsFromRoleTitle,
  matchesKeyword,
  mergeJobResults,
} from "./job-aggregator.js";
import { searchRemoteOkJobs } from "./remoteok.client.js";
import { isMarketAvailable } from "../../services/market-ingest.service.js";

describe("bls.client", () => {
  it("builds national OEWS series for SOC", () => {
    const id = buildOewsSeriesId("151252", "N", "0000000");
    assert.equal(id.length, 25);
    assert.ok(id.startsWith("OEUN"));
    assert.ok(id.endsWith("13"));
    assert.ok(id.includes("151252"));
  });

  it("guesses software engineer SOC", () => {
    assert.equal(guessSocFromTitle("Senior Software Engineer"), "151252");
  });

  it("estimateFromTitle returns bands", () => {
    const est = estimateFromTitle("Staff Engineer");
    assert.ok(est.p50 >= est.p25);
    assert.ok(est.p75 >= est.p50);
  });
});

describe("job-aggregator", () => {
  it("merges and dedupes job results", () => {
    const merged = mergeJobResults(
      [
        {
          source: "remoteok",
          postingCount: 10,
          roles: [
            {
              title: "Engineer",
              company: "A",
              url: "https://example.com/1",
              postedAt: new Date().toISOString(),
            },
          ],
        },
        {
          source: "arbeitnow",
          postingCount: 5,
          roles: [
            {
              title: "Engineer",
              company: "A",
              url: "https://example.com/2",
              postedAt: new Date().toISOString(),
            },
            {
              title: "Designer",
              company: "B",
              url: "https://example.com/3",
              postedAt: new Date().toISOString(),
            },
          ],
        },
      ],
      8,
    );
    assert.equal(merged.roles.length, 2);
    assert.ok(merged.sources.includes("remoteok"));
    assert.ok(merged.postingCount >= 10);
  });

  it("matches keyword tokens", () => {
    assert.ok(matchesKeyword("Senior Software Engineer at Acme", "software engineer"));
    assert.ok(!matchesKeyword("Chef", "software engineer"));
  });

  it("derives tags from role title", () => {
    const tags = keywordsFromRoleTitle("Staff AI Engineer");
    assert.ok(tags.length > 0);
  });
});

describe("market availability", () => {
  it("is available when jobs exist without registered APIs", () => {
    assert.equal(isMarketAvailable(["remoteok"], 3), true);
  });

  it("is available with heuristic wage only when no jobs", () => {
    assert.equal(isMarketAvailable(["heuristic_wage"], 0), true);
    assert.equal(isMarketAvailable([], 0), false);
  });
});

describe("remoteok.client", () => {
  it("filters API rows by role keyword", async () => {
    const fetchMock = mock.method(globalThis, "fetch", async () => ({
      ok: true,
      json: async () => [
        { id: "meta" },
        {
          id: 1,
          position: "Senior Software Engineer",
          company: "Acme",
          url: "https://example.com/job/1",
          date: "2026-01-01",
        },
        {
          id: 2,
          position: "Pastry Chef",
          company: "Bakery",
          url: "https://example.com/job/2",
        },
      ],
    }));

    try {
      const result = await searchRemoteOkJobs("Software Engineer", 5);
      assert.ok(result);
      assert.equal(result.source, "remoteok");
      assert.equal(result.roles.length, 1);
      assert.equal(result.roles[0]?.title, "Senior Software Engineer");
    } finally {
      fetchMock.mock.restore();
    }
  });
});

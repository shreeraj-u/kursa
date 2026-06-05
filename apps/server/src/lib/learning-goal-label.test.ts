import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { formatLearningGoalLabel } from "./learning-goal-label.js";

describe("formatLearningGoalLabel", () => {
  it("returns short names unchanged", () => {
    assert.equal(formatLearningGoalLabel("TypeScript"), "TypeScript");
  });

  it("extracts topic from journal-style learning text", () => {
    const long =
      "today i learned about AI agent harnesses, and how to develop them. I also learned some basic python";
    const label = formatLearningGoalLabel(long);
    assert.ok(label.length <= 40);
    assert.match(label.toLowerCase(), /ai agent harnesses|today i learned/);
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { shouldAttemptChatLearning } from "./chat-learn.service.js";

describe("chat-learn.service", () => {
  it("skips platitudes", () => {
    assert.equal(shouldAttemptChatLearning("thanks"), false);
    assert.equal(shouldAttemptChatLearning("ok"), false);
  });

  it("accepts long substantive messages", () => {
    assert.equal(
      shouldAttemptChatLearning(
        "I want you to remember that I am currently learning JavaScript to improve my skill set.",
      ),
      true,
    );
  });

  it("accepts short factual signal messages", () => {
    assert.equal(shouldAttemptChatLearning("remember I work at Acme"), true);
  });
});

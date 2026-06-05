import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { mapProposalSourceToSkillSource } from "./skills.service.js";

describe("skills.service", () => {
  it("maps chat proposal source to inferred_chat skill source", () => {
    assert.equal(mapProposalSourceToSkillSource("chat"), "inferred_chat");
  });

  it("maps journal proposal source to inferred_journal", () => {
    assert.equal(mapProposalSourceToSkillSource("journal"), "inferred_journal");
  });
});

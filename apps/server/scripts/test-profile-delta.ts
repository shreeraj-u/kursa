import { computeProfileUpdateDelta } from "../src/compute/profile-delta.js";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const winDelta = computeProfileUpdateDelta({
  id: "1",
  type: "win",
  body: "Shipped feature",
  structured: { title: "Shipped feature", body: "Led retry queue", skillNames: ["TypeScript"] },
});

assert(winDelta.newAchievements?.length === 1, "win should create achievement");
assert(winDelta.skillLastUsed?.[0]?.name === "TypeScript", "win should bump skill");

const learningDelta = computeProfileUpdateDelta({
  id: "2",
  type: "learning",
  body: null,
  structured: { skillName: "Rust" },
});

assert(learningDelta.newLearningGoals?.[0]?.skillName === "Rust", "learning should add goal");

const noteDelta = computeProfileUpdateDelta({
  id: "3",
  type: "note",
  body: "note",
  structured: { body: "note" },
});

assert(Object.keys(noteDelta).length === 0, "note should not produce delta");

console.log("profile-delta tests passed");

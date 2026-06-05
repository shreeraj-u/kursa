import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getAllowedOrigins, isValidOriginList } from "./allowed-origins.ts";

void describe("getAllowedOrigins", () => {
  void it("keeps configured origins in order and trims comma-separated values", () => {
    assert.deepEqual(
      getAllowedOrigins(" https://app.kursa.io,https://admin.kursa.io ", "production"),
      ["https://app.kursa.io", "https://admin.kursa.io"],
    );
  });

  void it("adds localhost twin origins outside production", () => {
    assert.deepEqual(getAllowedOrigins("http://localhost:3001", "development"), [
      "http://localhost:3001",
      "http://127.0.0.1:3001",
    ]);
  });

  void it("does not add localhost twins in production", () => {
    assert.deepEqual(getAllowedOrigins("http://localhost:3001", "production"), [
      "http://localhost:3001",
    ]);
  });
});

void describe("isValidOriginList", () => {
  void it("accepts one or more valid URL origins", () => {
    assert.equal(isValidOriginList("https://app.kursa.io, http://localhost:3001"), true);
  });

  void it("rejects empty or invalid origin lists", () => {
    assert.equal(isValidOriginList(""), false);
    assert.equal(isValidOriginList("https://app.kursa.io,not-a-url"), false);
  });
});

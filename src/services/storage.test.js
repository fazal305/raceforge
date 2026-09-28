import { describe, it, expect, beforeEach } from "vitest";
import { storage } from "./storage.js";

beforeEach(() => {
  window.localStorage.clear();
});

describe("storage service", () => {
  it("reports availability when localStorage works", () => {
    expect(storage.isAvailable()).toBe(true);
  });

  it("round-trips a written value", () => {
    storage.write("test-key", { a: 1, b: [1, 2, 3] });
    expect(storage.read("test-key", null)).toEqual({ a: 1, b: [1, 2, 3] });
  });

  it("returns the fallback when nothing is stored", () => {
    expect(storage.read("missing-key", "fallback")).toBe("fallback");
  });

  it("returns the fallback for corrupted JSON instead of throwing", () => {
    window.localStorage.setItem("raceforge:broken", "{not valid json");
    expect(() => storage.read("broken", "fallback")).not.toThrow();
    expect(storage.read("broken", "fallback")).toBe("fallback");
  });

  it("returns the fallback when the stored schema version is stale", () => {
    window.localStorage.setItem(
      "raceforge:stale",
      JSON.stringify({ version: 0, value: "old" }),
    );
    expect(storage.read("stale", "fallback")).toBe("fallback");
  });

  it("removes a key", () => {
    storage.write("to-remove", 42);
    storage.remove("to-remove");
    expect(storage.read("to-remove", null)).toBe(null);
  });
});

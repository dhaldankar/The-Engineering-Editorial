import { describe, it, expect } from "vitest";
import { buildGrainKey } from "../src/grain";

describe("buildGrainKey", () => {
  it("generates deterministic keys regardless of object property insertion order", () => {
    const key1 = buildGrainKey({ repo: "r1", period: "p1" });
    const key2 = buildGrainKey({ period: "p1", repo: "r1" });
    
    expect(key1).toBe("period:p1|repo:r1");
    expect(key1).toBe(key2);
  });

  it("ignores undefined and null values", () => {
    const key = buildGrainKey({ repo: "r1", pr: undefined, cluster: undefined });
    expect(key).toBe("repo:r1");
  });
});

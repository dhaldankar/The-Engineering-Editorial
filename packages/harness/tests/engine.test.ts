import { describe, it, expect } from "vitest";
import { HarnessEngine, CircularDependencyError } from "../src/engine";
import { MetricDefinition, defineMetric } from "../src/types";
import { sql } from "drizzle-orm";

describe("HarnessEngine", () => {
  it("detects circular dependencies and throws", () => {
    const metricA = defineMetric({
      name: "metric_a",
      version: 1,
      tier: "aggregate",
      grain: ["repo"],
      reads: ["metric_b"],
      compute: async () => sql`SELECT 1`,
    });

    const metricB = defineMetric({
      name: "metric_b",
      version: 1,
      tier: "aggregate",
      grain: ["repo"],
      reads: ["metric_a"],
      compute: async () => sql`SELECT 1`,
    });

    class TestHarnessEngine extends HarnessEngine {
      constructor() {
        super({}); // mock dbClient
        // override internal state for testing
        (this as any).executionPlan = (this as any).sortRegistry([metricA, metricB]);
      }
    }

    expect(() => {
      new TestHarnessEngine();
    }).toThrowError(CircularDependencyError);
  });
});

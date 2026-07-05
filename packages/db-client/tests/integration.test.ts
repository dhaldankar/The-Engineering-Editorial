import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createDbClient } from "../src/index";
import { withTenant, TenancyViolationError } from "../src/tenancy";
import { products, repositories } from "../src/schema";
import postgres from "postgres";

describe("db-client integration and tenancy", () => {
  it("withTenant throws TenancyViolationError if no productId is provided", () => {
    expect(() => {
      withTenant(repositories, null);
    }).toThrowError(TenancyViolationError);
  });

  it("withTenant returns proper SQL condition when productId is provided", () => {
    const condition = withTenant(repositories, "prod-123");
    expect(condition).toBeDefined();
  });

  // Example integration test that would run against a live local DB
  it.skip("can query the database successfully", async () => {
    const client = createDbClient({ mode: "proxy", connectionString: process.env.DATABASE_URL! });
    const res = await client.select().from(products).limit(1);
    expect(Array.isArray(res)).toBe(true);
  });
});

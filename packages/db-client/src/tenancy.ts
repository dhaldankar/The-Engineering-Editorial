import { eq, SQL } from "drizzle-orm";

export class TenancyViolationError extends Error {
  constructor() {
    super("Tenancy violation: product_id is required");
    this.name = "TenancyViolationError";
  }
}

/**
 * Ensures that a query is scoped to a specific tenant.
 * Requires the table to have a `productId` column.
 */
export function withTenant<T extends { productId: any }>(
  table: T,
  productId: string | undefined | null
): SQL {
  if (!productId) {
    throw new TenancyViolationError();
  }
  return eq(table.productId, productId);
}

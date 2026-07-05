import { db } from "./db.js";
import { repositories, withTenant } from "@engineering-editorial/db-client";
import { eq } from "drizzle-orm";

export class ConfigRepository {
  async getRepositories(tenantId: string) {
    const repos = await db
      .select()
      .from(repositories)
      .where(withTenant(repositories, tenantId));
    return repos;
  }
}

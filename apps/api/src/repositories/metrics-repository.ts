import { db } from "./db.js";
import { metricFact, metricRun, withTenant } from "@engineering-editorial/db-client";
import { and, eq } from "drizzle-orm";

export class MetricsRepository {
  async getMetricsOverview(tenantId: string) {
    const facts = await db
      .select()
      .from(metricFact)
      .where(
        and(
          withTenant(metricFact, tenantId),
          eq(metricFact.tier, "gold"),
          eq(metricFact.grain, "overall")
        )
      );

    return facts;
  }

  async getMetricByName(tenantId: string, metricName: string) {
    const facts = await db
      .select()
      .from(metricFact)
      .where(
        and(
          withTenant(metricFact, tenantId),
          eq(metricFact.tier, "gold"),
          eq(metricFact.metricName, metricName)
        )
      );

    return facts;
  }

  async getSyncStatus(tenantId: string, runId: string) {
    const runs = await db
      .select()
      .from(metricRun)
      .where(
        and(
          withTenant(metricRun, tenantId),
          eq(metricRun.runId, runId)
        )
      )
      .limit(1);

    return runs[0] || null;
  }
}

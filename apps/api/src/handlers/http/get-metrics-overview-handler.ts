import { ok, serverError } from "../../core/http.js";
import { withAuth, AuthenticatedEvent } from "../../core/middleware/auth-middleware.js";
import { MetricsRepository } from "../../repositories/metrics-repository.js";

const metricsRepo = new MetricsRepository();

export const handler = withAuth(async (event: AuthenticatedEvent) => {
  try {
    const { tenantId } = event;
    const overview = await metricsRepo.getMetricsOverview(tenantId);
    
    // Map facts to DashboardMetricResponse structure
    const metrics = overview.map((fact) => ({
      metricName: fact.metricName,
      value: fact.valueNum ?? null,
    }));

    return ok({ metrics });
  } catch (err) {
    console.error("Overview handler error:", err);
    return serverError(err);
  }
});

import { ok, serverError } from "../../core/http.js";
import { withAuth, AuthenticatedEvent } from "../../core/middleware/auth-middleware.js";
import { MetricsRepository } from "../../repositories/metrics-repository.js";

const metricsRepo = new MetricsRepository();

export const handler = withAuth(async (event: AuthenticatedEvent) => {
  try {
    const { tenantId } = event;
    const allocationFacts = await metricsRepo.getMetricByName(tenantId, "resource_allocation");
    
    return ok({ allocationFacts });
  } catch (err) {
    console.error("Allocation handler error:", err);
    return serverError(err);
  }
});

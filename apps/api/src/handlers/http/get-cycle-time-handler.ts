import { ok, serverError } from "../../core/http.js";
import { withAuth, AuthenticatedEvent } from "../../core/middleware/auth-middleware.js";
import { MetricsRepository } from "../../repositories/metrics-repository.js";

const metricsRepo = new MetricsRepository();

export const handler = withAuth(async (event: AuthenticatedEvent) => {
  try {
    const { tenantId } = event;
    const cycleTimeFacts = await metricsRepo.getMetricByName(tenantId, "cycle_time");
    
    return ok({ cycleTimeFacts });
  } catch (err) {
    console.error("Cycle time handler error:", err);
    return serverError(err);
  }
});

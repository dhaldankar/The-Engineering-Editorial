import { ok, serverError, badRequest } from "../../core/http.js";
import { withAuth, AuthenticatedEvent } from "../../core/middleware/auth-middleware.js";
import { MetricsRepository } from "../../repositories/metrics-repository.js";

const metricsRepo = new MetricsRepository();

export const handler = withAuth(async (event: AuthenticatedEvent) => {
  try {
    const { tenantId } = event;
    const jobId = event.queryStringParameters?.jobId;

    if (!jobId) {
      return badRequest("Missing jobId parameter");
    }

    const run = await metricsRepo.getSyncStatus(tenantId, jobId);

    if (!run) {
      return badRequest("Job not found");
    }

    return ok({
      jobId: run.runId,
      status: run.status,
    });
  } catch (err) {
    console.error("Get sync status handler error:", err);
    return serverError(err);
  }
});

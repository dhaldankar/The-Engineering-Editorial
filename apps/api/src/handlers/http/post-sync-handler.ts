import { accepted, serverError } from "../../core/http.js";
import { withAuth, AuthenticatedEvent } from "../../core/middleware/auth-middleware.js";
import { validateBody } from "../../core/middleware/validate-body.js";
import { SyncJobRequestSchema, SyncJobRequest } from "../../dto/sync-job.js";
import { SqsAdapter } from "../../adapters/sqs-adapter.js";

const sqsAdapter = new SqsAdapter();

export const handler = withAuth(
  validateBody(SyncJobRequestSchema, async (event: AuthenticatedEvent & { parsedBody: SyncJobRequest }) => {
    try {
      const { tenantId, parsedBody } = event;
      
      const payload = {
        tenantId,
        repoId: parsedBody.repoId,
        fullSync: parsedBody.fullSync,
        timestamp: new Date().toISOString()
      };

      const messageId = await sqsAdapter.sendSyncJob(payload);
      
      return accepted({ jobId: messageId, status: "queued" });
    } catch (err) {
      console.error("Post sync handler error:", err);
      return serverError(err);
    }
  })
);

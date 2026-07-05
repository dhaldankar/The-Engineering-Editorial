import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { env } from "../config/env.js";

const sqsClient = new SQSClient({});

export class SqsAdapter {
  async sendSyncJob(payload: any) {
    try {
      const command = new SendMessageCommand({
        QueueUrl: env.SYNC_JOB_QUEUE_URL,
        MessageBody: JSON.stringify(payload),
      });
      const response = await sqsClient.send(command);
      return response.MessageId;
    } catch (err) {
      console.error("Failed to send SQS message:", err);
      throw err;
    }
  }
}

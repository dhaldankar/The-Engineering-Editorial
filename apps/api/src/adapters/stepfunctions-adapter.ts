import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { env } from "../config/env.js";

const sfnClient = new SFNClient({});

export class StepFunctionsAdapter {
  async startSyncExecution(payload: any) {
    try {
      const command = new StartExecutionCommand({
        stateMachineArn: env.SYNC_STATE_MACHINE_ARN,
        input: JSON.stringify(payload),
      });
      const response = await sfnClient.send(command);
      return response.executionArn;
    } catch (err) {
      console.error("Failed to start step functions execution:", err);
      throw err;
    }
  }
}

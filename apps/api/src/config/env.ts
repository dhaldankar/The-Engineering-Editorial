import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  SYNC_JOB_QUEUE_URL: z.string().url(),
  SYNC_STATE_MACHINE_ARN: z.string().startsWith("arn:aws:states:"),
  COGNITO_USER_POOL_ID: z.string().min(1),
  COGNITO_CLIENT_ID: z.string().min(1).optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:", parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;

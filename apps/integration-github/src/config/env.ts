import { z } from 'zod';

const envSchema = z.object({
  GITHUB_APP_ID: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GITHUB_WEBHOOK_SECRET: z.string().min(1),
  ENCRYPTION_KEY_V1: z.string().min(32),
});

export const env = envSchema.parse(process.env);

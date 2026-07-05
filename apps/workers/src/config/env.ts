import { z } from 'zod';

const envSchema = z.object({
  BEDROCK_MODEL_ID: z.string().min(1),
  BEDROCK_REGION: z.string().min(1),
  DATABASE_URL: z.string().url(),
  // Add other necessary environment variables as needed
});

export type Config = z.infer<typeof envSchema>;

// Fail fast by parsing at module load
export const config = envSchema.parse(process.env);

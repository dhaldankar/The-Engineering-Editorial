import { z } from 'zod';

export const StateChunkSchema = z.object({
  chunkId: z.string(),
  startIndex: z.number(),
  endIndex: z.number(),
  payload: z.any().optional()
});

export type StateChunk = z.infer<typeof StateChunkSchema>;

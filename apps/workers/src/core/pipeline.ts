import { StateChunkSchema, StateChunk } from '../dto/pipeline-payloads.js';

export function parseChunkContext(context: unknown): StateChunk {
  try {
    return StateChunkSchema.parse(context);
  } catch (error) {
    throw new Error(`Failed to parse chunk context: ${error instanceof Error ? error.message : String(error)}`);
  }
}

import { GrainDimension } from "./types";

/**
 * Transforms n-dimensional grains into a deterministic 1D string for Postgres UNIQUE constraints.
 * Sorts keys alphabetically before joining them with pipes (|).
 */
export function buildGrainKey(dimensions: Partial<Record<GrainDimension, string | number>>): string {
  const keys = Object.keys(dimensions).sort() as GrainDimension[];
  const parts: string[] = [];
  for (const key of keys) {
    const val = dimensions[key];
    if (val !== undefined && val !== null) {
      parts.push(`${key}:${val}`);
    }
  }
  return parts.join("|");
}

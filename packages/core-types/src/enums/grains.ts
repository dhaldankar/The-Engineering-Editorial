import { z } from 'zod';

export const GrainEnum = z.enum([
  'repo',
  'contributor',
  'cluster',
  'pr',
  'work_item',
  'period'
]);

export type Grain = z.infer<typeof GrainEnum>;

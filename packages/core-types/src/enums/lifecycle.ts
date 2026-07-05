import { z } from 'zod';

export const LifecyclePhaseEnum = z.enum([
  'backlog',
  'ready',
  'in_dev',
  'review',
  'qa',
  'done'
]);

export type LifecyclePhase = z.infer<typeof LifecyclePhaseEnum>;

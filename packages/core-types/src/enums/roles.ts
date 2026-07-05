import { z } from 'zod';

export const RoleEnum = z.enum([
  'admin',
  'viewer'
]);

export type Role = z.infer<typeof RoleEnum>;

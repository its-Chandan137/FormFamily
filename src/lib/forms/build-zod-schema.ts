import type { ResolvedForm } from '@/types';
import type { ZodTypeAny } from 'zod';

/**
 * Builds a Zod schema from a resolved form for submission validation.
 * Ignores hidden fields and applies field validation rules.
 */
export function buildZodSchema(_resolved: ResolvedForm): ZodTypeAny {
  throw new Error('Not implemented');
}

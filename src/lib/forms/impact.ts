import type { Form } from '@/types';

/**
 * Computes which forms are affected by a change to the given form.
 * Downward propagation only: editing a parent affects all descendants.
 */
export function computeImpact(
  _forms: Form[],
  _formId: string,
): { affectedFormIds: string[] } {
  throw new Error('Not implemented');
}

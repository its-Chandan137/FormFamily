import type { Form } from '@/types';
import { getDescendants } from './family-tree';

/**
 * Computes which forms are affected by a change to the given form.
 * Downward propagation only: editing a parent affects all its descendants,
 * not siblings or ancestors.
 */
export function computeImpact(
  forms: Form[],
  formId: string,
): { affectedFormIds: string[] } {
  return { affectedFormIds: getDescendants(forms, formId) };
}

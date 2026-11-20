import type { FormContent, ResolvedForm } from '@/types';

/**
 * Merges form content from root to leaf into a final resolved form.
 * - Applies overrides unless the field is locked.
 * - Inserts own items after their anchors (anchor-based ordering).
 * - Accumulates locks down the chain.
 * - Resolves against published ancestor content only (caller provides the chain).
 */
export function resolveForm(
  _chain: FormContent[],
  _formIds: string[],
): ResolvedForm {
  throw new Error('Not implemented');
}

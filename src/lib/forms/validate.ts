import type { FormContent } from '@/types';

/**
 * Detects key conflicts when a parent adds a field whose key a child already added itself.
 * Caller can warn the user and offer to merge (replace child's own copy with inherited field,
 * optionally keeping child's custom label as an override).
 */
export function findKeyConflicts(
  _parentContent: FormContent,
  _descendantContents: FormContent[],
): Array<{ key: string; descendantIndex: number }> {
  throw new Error('Not implemented');
}

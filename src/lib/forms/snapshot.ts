import type { FormContent } from '@/types';

/**
 * Copies inherited fields into the form as its own fields.
 * Used by detach-from-family and delete-with-children flows so the form becomes standalone
 * (or children can keep inherited fields as their own).
 */
export function snapshotInherited(
  _chain: FormContent[],
  _formContent: FormContent,
): FormContent {
  throw new Error('Not implemented');
}

import type { Form } from '@/types';

/** Returns ancestor form ids from parent up to root for the given form. */
export function getAncestors(_forms: Form[], _formId: string): string[] {
  throw new Error('Not implemented');
}

/** Returns all descendant form ids for the given form. */
export function getDescendants(_forms: Form[], _formId: string): string[] {
  throw new Error('Not implemented');
}

/** Returns depth where root is level 1. */
export function getDepth(_forms: Form[], _formId: string): number {
  throw new Error('Not implemented');
}

/** Returns true if setting newParentId as parent of formId would create a cycle. */
export function wouldCreateCycle(
  _forms: Form[],
  _formId: string,
  _newParentId: string,
): boolean {
  throw new Error('Not implemented');
}

/** Returns true if the reparent/move would exceed MAX_FAMILY_DEPTH (5). */
export function exceedsMaxDepth(
  _forms: Form[],
  _formId: string,
  _newParentId: string | null,
): boolean {
  throw new Error('Not implemented');
}

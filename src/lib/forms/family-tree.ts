import { MAX_FAMILY_DEPTH } from '@/lib/constants';
import type { Form } from '@/types';

function byId(forms: readonly Form[]): Map<string, Form> {
  return new Map(forms.map((f) => [f.id, f]));
}

/** Returns ancestor form ids from the immediate parent up to the root. */
export function getAncestors(forms: Form[], formId: string): string[] {
  const map = byId(forms);
  const ancestors: string[] = [];
  let current = map.get(formId);
  const seen = new Set<string>();
  while (current?.parentFormId) {
    const parentId = current.parentFormId;
    if (seen.has(parentId)) break; // defensive against corrupt data
    seen.add(parentId);
    ancestors.push(parentId);
    current = map.get(parentId);
  }
  return ancestors;
}

/** Returns all descendant form ids for the given form (breadth/depth order not specified). */
export function getDescendants(forms: Form[], formId: string): string[] {
  const childrenByParent = new Map<string | null, string[]>();
  for (const form of forms) {
    const list = childrenByParent.get(form.parentFormId) ?? [];
    list.push(form.id);
    childrenByParent.set(form.parentFormId, list);
  }

  const result: string[] = [];
  const queue: string[] = [...(childrenByParent.get(formId) ?? [])];
  const seen = new Set<string>(queue);
  while (queue.length > 0) {
    const id = queue.shift()!;
    result.push(id);
    for (const childId of childrenByParent.get(id) ?? []) {
      if (!seen.has(childId)) {
        seen.add(childId);
        queue.push(childId);
      }
    }
  }
  return result;
}

/** Returns depth where root is level 1. */
export function getDepth(forms: Form[], formId: string): number {
  return getAncestors(forms, formId).length + 1;
}

/** Returns true if setting newParentId as parent of formId would create a cycle. */
export function wouldCreateCycle(
  forms: Form[],
  formId: string,
  newParentId: string,
): boolean {
  if (newParentId === formId) return true;
  const descendants = new Set(getDescendants(forms, formId));
  return descendants.has(newParentId);
}

/**
 * Returns true if making newParentId the parent of formId would place formId or
 * any of its descendants deeper than MAX_FAMILY_DEPTH (5). `newParentId: null`
 * makes formId a root.
 */
export function exceedsMaxDepth(
  forms: Form[],
  formId: string,
  newParentId: string | null,
): boolean {
  const newParentDepth = newParentId ? getDepth(forms, newParentId) : 0;
  const newDepthOfForm = newParentDepth + 1;

  // Height of formId's subtree: 1 if no descendants.
  const descendants = getDescendants(forms, formId);
  let maxDescendantDelta = 0;
  if (descendants.length > 0) {
    const currentDepth = getDepth(forms, formId);
    for (const dId of descendants) {
      const delta = getDepth(forms, dId) - currentDepth;
      if (delta > maxDescendantDelta) maxDescendantDelta = delta;
    }
  }

  const deepest = newDepthOfForm + maxDescendantDelta;
  return deepest > MAX_FAMILY_DEPTH;
}

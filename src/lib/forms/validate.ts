import type { FormContent } from '@/types';

/**
 * Detects key conflicts when a parent adds a field whose key a descendant
 * already owns as its own field. `descendantIndex` is the index in the provided
 * `descendantContents` array.
 */
export function findKeyConflicts(
  parentContent: FormContent,
  descendantContents: FormContent[],
): Array<{ key: string; descendantIndex: number }> {
  const parentKeys = new Set(parentContent.ownFields.map((f) => f.key));
  const conflicts: Array<{ key: string; descendantIndex: number }> = [];

  descendantContents.forEach((desc, descendantIndex) => {
    for (const field of desc.ownFields) {
      if (parentKeys.has(field.key)) {
        conflicts.push({ key: field.key, descendantIndex });
      }
    }
  });

  return conflicts;
}

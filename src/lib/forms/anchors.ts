import { START_ANCHOR } from '@/lib/constants';

/**
 * Anchor-based ordering utilities.
 *
 * - `insertAfter: START_ANCHOR` ('__start__') places an item at the very top.
 * - `insertAfter: null` places an item at the end of the form.
 * - `insertAfter: <key|id>` places an item immediately after that anchor.
 * - If the anchor no longer exists (e.g. deleted by a parent), the item falls
 *   back to the end of its section/form.
 * - Items sharing the same anchor keep their relative order within the inserted
 *   batch.
 * - Hidden fields keep their position so unhiding restores layout.
 */

export type InsertAfter = string | null;

/**
 * Insert `incoming` items into `existing` in anchor order. For each incoming
 * item, find its anchor in the current list and insert immediately after that
 * anchor (after any items from this same batch already inserted for the same
 * anchor). Items whose anchor is missing fall back to the end.
 */
export function insertAnchoredItems<T>(
  existing: readonly T[],
  incoming: readonly T[],
  getId: (item: T) => string,
  getInsertAfter: (item: T) => InsertAfter,
): T[] {
  const result: T[] = [...existing];
  // Track how many items from this batch were appended after each anchor key.
  const placedAfterAnchorCount = new Map<string, number>();

  for (const item of incoming) {
    const anchor = getInsertAfter(item);
    const insertIndex = resolveInsertIndex(
      result,
      getId,
      anchor,
      placedAfterAnchorCount,
    );
    result.splice(insertIndex, 0, item);
    const anchorKey = anchorKeyForCount(anchor, result, getId, insertIndex);
    placedAfterAnchorCount.set(
      anchorKey,
      (placedAfterAnchorCount.get(anchorKey) ?? 0) + 1,
    );
  }

  return result;
}

function anchorKeyForCount<T>(
  anchor: InsertAfter,
  _result: readonly T[],
  _getId: (item: T) => string,
  _insertIndex: number,
): string {
  if (anchor === START_ANCHOR) return START_ANCHOR;
  if (anchor == null) return '__end__';
  // If anchor was missing we fell back to end; treat as end bucket for stable
  // relative ordering of subsequent fallbacks in the same batch.
  return anchor;
}

function resolveInsertIndex<T>(
  result: readonly T[],
  getId: (item: T) => string,
  anchor: InsertAfter,
  placedAfterAnchorCount: Map<string, number>,
): number {
  if (anchor == null) {
    return result.length;
  }

  if (anchor === START_ANCHOR) {
    const offset = placedAfterAnchorCount.get(START_ANCHOR) ?? 0;
    return offset;
  }

  const anchorIndex = result.findIndex((item) => getId(item) === anchor);
  if (anchorIndex === -1) {
    // Anchor deleted by parent: fall back to end of its section/form.
    return result.length;
  }

  const offset = placedAfterAnchorCount.get(anchor) ?? 0;
  return anchorIndex + 1 + offset;
}

/**
 * Convenience wrapper matching the common "apply anchors" mental model:
 * insert a batch of items into a base sequence.
 */
export function applyAnchors<T>(
  base: readonly T[],
  additions: readonly T[],
  getId: (item: T) => string,
  getInsertAfter: (item: T) => InsertAfter,
): T[] {
  return insertAnchoredItems(base, additions, getId, getInsertAfter);
}

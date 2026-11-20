import { describe, it } from 'vitest';

describe('family-tree', () => {
  it.todo('getAncestors returns chain from parent to root');
  it.todo('getDescendants returns all descendants');
  it.todo('getDepth returns root as level 1 and respects MAX_FAMILY_DEPTH');
  it.todo('wouldCreateCycle detects cycles on reparent');
  it.todo('exceedsMaxDepth prevents depth > 5');
});

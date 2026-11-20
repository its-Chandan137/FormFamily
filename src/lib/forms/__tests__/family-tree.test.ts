import { describe, expect, it } from 'vitest';
import type { Form } from '@/types';
import {
  exceedsMaxDepth,
  getAncestors,
  getDepth,
  getDescendants,
  wouldCreateCycle,
} from '../family-tree';

function form(id: string, parentFormId: string | null = null): Form {
  return {
    id,
    orgId: 'org',
    parentFormId,
    name: id,
    slug: id,
    publishedVersionId: null,
  };
}

describe('family-tree', () => {
  const forms: Form[] = [
    form('root', null),
    form('child', 'root'),
    form('grand', 'child'),
    form('sibling', 'root'),
    form('grand2', 'child'),
  ];

  it('getAncestors returns chain from parent to root', () => {
    expect(getAncestors(forms, 'grand')).toEqual(['child', 'root']);
    expect(getAncestors(forms, 'child')).toEqual(['root']);
    expect(getAncestors(forms, 'root')).toEqual([]);
  });

  it('getDescendants returns all descendants', () => {
    const desc = getDescendants(forms, 'root');
    expect(desc.sort()).toEqual(['child', 'grand', 'grand2', 'sibling'].sort());
    expect(getDescendants(forms, 'child').sort()).toEqual(
      ['grand', 'grand2'].sort(),
    );
    expect(getDescendants(forms, 'grand')).toEqual([]);
  });

  it('getDepth returns root as level 1 and respects MAX_FAMILY_DEPTH', () => {
    expect(getDepth(forms, 'root')).toBe(1);
    expect(getDepth(forms, 'child')).toBe(2);
    expect(getDepth(forms, 'grand')).toBe(3);
  });

  it('11. wouldCreateCycle rejects moving a form under itself or one of its descendants', () => {
    expect(wouldCreateCycle(forms, 'root', 'root')).toBe(true);
    expect(wouldCreateCycle(forms, 'root', 'child')).toBe(true);
    expect(wouldCreateCycle(forms, 'root', 'grand')).toBe(true);
    expect(wouldCreateCycle(forms, 'child', 'grand')).toBe(true);
    expect(wouldCreateCycle(forms, 'child', 'root')).toBe(false);
    expect(wouldCreateCycle(forms, 'grand', 'sibling')).toBe(false);
  });

  it('12. exceedsMaxDepth rejects creating a child at level 6', () => {
    // Build a chain of depth 5: l1(root)->l2->l3->l4->l5
    const chain: Form[] = [
      form('l1', null),
      form('l2', 'l1'),
      form('l3', 'l2'),
      form('l4', 'l3'),
      form('l5', 'l4'),
      form('new', null),
    ];
    expect(getDepth(chain, 'l5')).toBe(5);
    expect(exceedsMaxDepth(chain, 'new', 'l5')).toBe(true); // would become level 6
    expect(exceedsMaxDepth(chain, 'new', 'l4')).toBe(false); // would become level 5

    // Moving a subtree: if moving 'l3' (with l4,l5 below it) under a node so deepest > 5
    const chain2: Form[] = [
      form('a1', null),
      form('a2', 'a1'),
      form('a3', 'a2'),
      form('b1', null),
      form('b2', 'b1'),
      form('b3', 'b2'),
    ];
    // move b1 (depth1, subtree deepest b3 depth3 => delta 2) under a3 (depth3) => b1 becomes 4, b3 becomes 6
    expect(exceedsMaxDepth(chain2, 'b1', 'a3')).toBe(true);
    expect(exceedsMaxDepth(chain2, 'b1', 'a2')).toBe(false);
    expect(exceedsMaxDepth(chain, 'new', null)).toBe(false);
  });
});
